import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Chip, IconButton } from '@mui/material';
import { Plus, Search, X, Tag, TrendingUp, Package } from 'lucide-react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ProfessionalDataGrid from '../shared/ProfessionalDataGrid';
import MuiModal from '../shared/MuiModal';
import AddProduct from './AddProduct';
import axios from 'axios';
import Layout from '../Layout';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';

const Product = () => {
    const [allProducts, setAllProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [vendors, setVendors] = useState([]);

    // Filters
    const [search, setSearch] = useState('');
    const [vendorFilter, setVendorFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [marginFilter, setMarginFilter] = useState('all'); // 'all' | 'high' | 'mid' | 'low'

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/get-products?limit=5000`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, withCredentials: true }
            );
            const productsData = (response.data.data.products || []).map(p => ({ ...p, id: p._id }));
            setAllProducts(productsData);
            setProducts(productsData);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/list?limit=1000`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, withCredentials: true }
            );
            setVendors(response.data.data.vendors || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    useEffect(() => { fetchProducts(); fetchVendors(); }, []);

    // Derive categories
    const categories = useMemo(() => {
        return [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();
    }, [allProducts]);

    // Margin helper
    const getMargin = (p) => p.cost > 0 ? ((p.salePrice - p.cost) / p.cost) * 100 : 0;

    // Apply filters
    useEffect(() => {
        let filtered = [...allProducts];

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.vendor?.name?.toLowerCase().includes(q)
            );
        }

        if (vendorFilter !== 'all') filtered = filtered.filter(p => p.vendor?._id === vendorFilter || p.vendor === vendorFilter);
        if (categoryFilter !== 'all') filtered = filtered.filter(p => p.category === categoryFilter);

        if (marginFilter === 'high') filtered = filtered.filter(p => getMargin(p) > 30);
        else if (marginFilter === 'mid') filtered = filtered.filter(p => getMargin(p) >= 15 && getMargin(p) <= 30);
        else if (marginFilter === 'low') filtered = filtered.filter(p => getMargin(p) < 15);

        setProducts(filtered);
    }, [search, vendorFilter, categoryFilter, marginFilter, allProducts]);

    // Stats
    const stats = useMemo(() => ({
        total: allProducts.length,
        filtered: products.length,
        avgMargin: products.length > 0 ? products.reduce((s, p) => s + getMargin(p), 0) / products.length : 0,
        highMargin: products.filter(p => getMargin(p) > 30).length,
    }), [products, allProducts]);

    const clearFilters = () => { setSearch(''); setVendorFilter('all'); setCategoryFilter('all'); setMarginFilter('all'); };
    const hasActiveFilter = search || vendorFilter !== 'all' || categoryFilter !== 'all' || marginFilter !== 'all';

    const handleEdit = (product) => { setSelectedProduct(product); setOpenModal(true); };

    const handleDelete = async (id) => {
        setConfirmDialog({
            open: true,
            title: "Delete Product",
            message: "Are you sure you want to delete this product?",
            onConfirm: async () => {
                try {
                    await axios.delete(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/delete-product/${id}`,
                        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, withCredentials: true }
                    );
                    fetchProducts();
                } catch (error) {
                    console.error('Error deleting product:', error);
                    alert('Error deleting product');
                }
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
        });
    };

    const columns = [
        { field: 'name', headerName: 'Product Name', width: 180 },
        { field: 'category', headerName: 'Category', width: 140 },
        {
            field: 'cost', headerName: 'Cost Price', width: 120, type: 'number',
            valueFormatter: (v) => `₹${v?.toLocaleString('en-IN') || 0}`
        },
        {
            field: 'salePrice', headerName: 'Sale Price', width: 120, type: 'number',
            valueFormatter: (v) => `₹${v?.toLocaleString('en-IN') || 0}`
        },
        {
            field: 'margin', headerName: 'Margin %', width: 110, type: 'number',
            valueGetter: (v, row) => row.cost > 0 ? ((row.salePrice - row.cost) / row.cost * 100).toFixed(1) : 0,
            renderCell: (params) => (
                <Chip
                    label={`${params.value}%`}
                    color={params.value > 30 ? 'success' : params.value > 15 ? 'warning' : 'default'}
                    size="small"
                />
            )
        },
        {
            field: 'vendor', headerName: 'Vendor', width: 150,
            valueGetter: (v, row) => row.vendor?.name || 'N/A'
        },
        {
            field: 'taxes', headerName: 'Taxes', width: 180,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {params.value && params.value.length > 0 ? (
                        params.value.map((tax, idx) => (
                            <Chip key={idx} label={`${tax.name}: ${tax.rate}%`} size="small" variant="outlined" />
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                </Box>
            )
        },
        {
            field: 'actions', headerName: '', width: 90, sortable: false, filterable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleEdit(params.row)} size="small" color="primary"><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(params.row._id)} size="small" color="error"><DeleteIcon /></IconButton>
                </Box>
            )
        }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage your products, pricing and profit margins</p>
                    </div>
                    <button
                        onClick={() => { setSelectedProduct(null); setOpenModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white">
                        <Plus size={16} /> Add Product
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Products</span>
                            <Package size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.filtered}</p>
                        <p className="text-xs text-gray-400 mt-0.5">of {stats.total} total</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Margin</span>
                            <TrendingUp size={16} className="text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-green-700">{stats.avgMargin.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400 mt-0.5">across filtered products</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">High Margin</span>
                            <Tag size={16} className="text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.highMargin}</p>
                        <p className="text-xs text-gray-400 mt-0.5">products above 30% margin</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-48">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by product name, category, vendor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X size={14} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>

                    {/* Vendor dropdown */}
                    <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 font-medium">
                        <option value="all">All Vendors</option>
                        {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                    </select>

                    {/* Category dropdown */}
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 font-medium">
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Margin filter */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[
                            { key: 'all', label: 'All Margins' },
                            { key: 'high', label: 'High >30%' },
                            { key: 'mid', label: 'Mid 15-30%' },
                            { key: 'low', label: 'Low <15%' },
                        ].map(opt => (
                            <button key={opt.key} onClick={() => setMarginFilter(opt.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${marginFilter === opt.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {hasActiveFilter && (
                        <button onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                            <X size={13} /> Clear
                        </button>
                    )}

                    <span className="text-xs text-gray-400 ml-auto font-medium">{products.length} products</span>
                </div>

                {/* Table */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md overflow-hidden">
                    <Box sx={{ height: 560, width: '100%' }}>
                        <ProfessionalDataGrid
                            rows={products}
                            columns={columns}
                            loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </div>
            </div>

            <MuiModal open={openModal} onClose={() => { setOpenModal(false); setSelectedProduct(null); }}
                title={selectedProduct ? 'Edit Product' : 'Add Product'}>
                <AddProduct
                    product={selectedProduct}
                    onSuccess={() => { setOpenModal(false); setSelectedProduct(null); fetchProducts(); }}
                    onCancel={() => { setOpenModal(false); setSelectedProduct(null); }}
                />
            </MuiModal>

            <ConfirmDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />
        </Layout>
    );
};

export default Product;
