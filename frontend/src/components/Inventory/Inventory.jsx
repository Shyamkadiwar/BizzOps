import { useState, useEffect, useCallback, useMemo } from "react";
import { DataGrid } from '@mui/x-data-grid';
import axios from "axios";
import { Box, Typography, Chip, IconButton } from '@mui/material';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import { Plus, Upload, Download, Search, X, Package, AlertTriangle, CheckCircle, Boxes } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/Delete';
import AddInventory from "./AddInventory.jsx";
import MuiModal from "../shared/MuiModal";
import Layout from "../Layout.jsx";
import ConfirmDialog from "../shared/ConfirmDialog.jsx";
import PromptDialog from "../shared/PromptDialog.jsx";
import AlertDialog from "../shared/AlertDialog.jsx";

const token = localStorage.getItem('accessToken');

function Inventory() {
    const [inventoryItems, setInventoryItems] = useState([]);
    const [allItems, setAllItems] = useState([]); // full data for client-side filtering
    const [loading, setLoading] = useState(false);
    const [totalInventoryValue, setTotalInventoryValue] = useState(0);
    const [openModal, setOpenModal] = useState(false);

    // Filter states
    const [search, setSearch] = useState('');
    const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'out' | 'ok'
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Dialog states
    const [confirmDialog, setConfirmDialog] = useState({ open: false, itemId: null });
    const [promptDialog, setPromptDialog] = useState({ open: false, itemId: null, adjustment: 0 });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/get-item?page=1&limit=5000`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            if (response.status === 200 && response.data?.data) {
                const items = (response.data.data.inventoryItems || []).map(item => ({ ...item, id: item._id }));
                setAllItems(items);
                setInventoryItems(items);
                setTotalInventoryValue(response.data.data.totalInventoryValue || 0);
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            setAlertDialog({ open: true, title: "Error", message: "Failed to fetch inventory items", severity: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    // Derive categories from data
    const categories = useMemo(() => {
        const cats = [...new Set(allItems.map(i => i.category).filter(Boolean))].sort();
        return cats;
    }, [allItems]);

    // Apply filters whenever inputs change
    useEffect(() => {
        let filtered = [...allItems];

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(i =>
                i.item?.toLowerCase().includes(q) ||
                i.category?.toLowerCase().includes(q) ||
                i.warehouse?.toLowerCase().includes(q) ||
                i.vendor?.name?.toLowerCase().includes(q)
            );
        }

        if (stockFilter === 'out') filtered = filtered.filter(i => (i.stockRemain || 0) === 0);
        else if (stockFilter === 'low') filtered = filtered.filter(i => (i.stockRemain || 0) > 0 && (i.stockRemain || 0) <= 10);
        else if (stockFilter === 'ok') filtered = filtered.filter(i => (i.stockRemain || 0) > 10);

        if (categoryFilter !== 'all') filtered = filtered.filter(i => i.category === categoryFilter);

        setInventoryItems(filtered);
    }, [search, stockFilter, categoryFilter, allItems]);

    // Stats from filtered data
    const stats = useMemo(() => ({
        total: inventoryItems.length,
        outOfStock: inventoryItems.filter(i => (i.stockRemain || 0) === 0).length,
        lowStock: inventoryItems.filter(i => (i.stockRemain || 0) > 0 && (i.stockRemain || 0) <= 10).length,
        value: inventoryItems.reduce((sum, i) => sum + ((i.cost || 0) * (i.stockRemain || 0)), 0),
    }), [inventoryItems]);

    const clearFilters = () => {
        setSearch('');
        setStockFilter('all');
        setCategoryFilter('all');
    };

    const hasActiveFilter = search || stockFilter !== 'all' || categoryFilter !== 'all';

    const handleItemAdded = () => { setOpenModal(false); fetchInventory(); };

    const handleDelete = (id) => setConfirmDialog({ open: true, itemId: id });

    const confirmDelete = async () => {
        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/delete-item`,
                { product: confirmDialog.itemId },
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            setAlertDialog({ open: true, title: "Success", message: "Item deleted successfully", severity: "success" });
            fetchInventory();
        } catch (error) {
            setAlertDialog({ open: true, title: "Error", message: error.response?.data?.message || "Error deleting item", severity: "error" });
        }
    };

    const handleStockAdjustment = (id, adjustment) => setPromptDialog({ open: true, itemId: id, adjustment });

    const confirmStockAdjustment = async (quantity) => {
        const endpoint = promptDialog.adjustment > 0 ? 'add-stock' : 'remove-stock';
        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/${endpoint}`,
                { product: promptDialog.itemId, newQty: parseInt(quantity) },
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            setAlertDialog({ open: true, title: "Success", message: `Stock ${promptDialog.adjustment > 0 ? 'added' : 'removed'} successfully`, severity: "success" });
            fetchInventory();
        } catch (error) {
            setAlertDialog({ open: true, title: "Error", message: error.response?.data?.message || "Error adjusting stock", severity: "error" });
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/export/inventory`,
                { headers: { 'Authorization': token }, withCredentials: true, responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'inventory.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setAlertDialog({ open: true, title: "Success", message: "Inventory exported successfully", severity: "success" });
        } catch (error) {
            setAlertDialog({ open: true, title: "Error", message: "Failed to export inventory", severity: "error" });
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/import/inventory`,
                    formData,
                    { headers: { 'Authorization': token, 'Content-Type': 'multipart/form-data' }, withCredentials: true }
                );
                setAlertDialog({ open: true, title: "Success", message: `Import successful! ${response.data.data.success.length} items imported.`, severity: "success" });
                fetchInventory();
            } catch (error) {
                setAlertDialog({ open: true, title: "Error", message: "Failed to import inventory", severity: "error" });
            }
        };
        input.click();
    };

    const columns = [
        { field: 'item', headerName: 'Item', width: 160 },
        { field: 'category', headerName: 'Category', width: 120 },
        { field: 'warehouse', headerName: 'Warehouse', width: 120 },
        { field: 'cost', headerName: 'Cost', width: 100, type: 'number', valueFormatter: (v) => `₹${v?.toLocaleString('en-IN') || 0}` },
        { field: 'salePrice', headerName: 'Sale Price', width: 110, type: 'number', valueFormatter: (v) => `₹${v?.toLocaleString('en-IN') || 0}` },
        { field: 'vendor', headerName: 'Vendor', width: 140, valueGetter: (v, row) => row.vendor?.name || 'N/A' },
        {
            field: 'stockRemain', headerName: 'Stock', width: 100, type: 'number',
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={params.value > 10 ? 'success' : params.value > 0 ? 'warning' : 'error'}
                    size="small"
                />
            )
        },
        {
            field: 'totalValue', headerName: 'Total Value', width: 120, type: 'number',
            valueGetter: (v, row) => (row.cost || 0) * (row.stockRemain || 0),
            valueFormatter: (v) => `₹${v?.toLocaleString('en-IN') || 0}`
        },
        {
            field: 'taxes', headerName: 'Taxes', width: 140,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {params.value?.map((tax, idx) => (
                        <Chip key={idx} label={`${tax.name}: ${tax.rate}%`} size="small" variant="outlined" />
                    ))}
                </Box>
            )
        },
        {
            field: 'stockAdjustment', headerName: 'Adjust Stock', width: 120, sortable: false, filterable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton color="success" size="small" onClick={() => handleStockAdjustment(params.row._id, 1)} title="Add stock"><AddCircle /></IconButton>
                    <IconButton color="error" size="small" onClick={() => handleStockAdjustment(params.row._id, -1)} title="Remove stock"><RemoveCircle /></IconButton>
                </Box>
            )
        },
        {
            field: 'actions', headerName: '', width: 60, sortable: false, filterable: false,
            renderCell: (params) => (
                <IconButton color="error" size="small" onClick={() => handleDelete(params.row._id)}><DeleteIcon fontSize="small" /></IconButton>
            )
        }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Track stock levels, costs and product details</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setOpenModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600/90 hover:to-indigo-600/90 transition-all duration-200 text-sm font-medium text-white">
                            <Plus size={16} /> Add Item
                        </button>
                        <button onClick={handleImport}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                            <Upload size={16} /> Import
                        </button>
                        <button onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Items</span>
                            <Boxes size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{allItems.length} in inventory</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock Value</span>
                            <Package size={16} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.value.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">in filtered items</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Low Stock</span>
                            <AlertTriangle size={16} className="text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
                        <p className="text-xs text-gray-400 mt-0.5">items ≤ 10 units</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Out of Stock</span>
                            <AlertTriangle size={16} className="text-red-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
                        <p className="text-xs text-gray-400 mt-0.5">needs reordering</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-48">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search item, category, vendor, warehouse..."
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

                    {/* Stock Status Filter */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[
                            { key: 'all', label: 'All Stock' },
                            { key: 'ok', label: 'In Stock' },
                            { key: 'low', label: 'Low' },
                            { key: 'out', label: 'Out' },
                        ].map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setStockFilter(opt.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${stockFilter === opt.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Category Dropdown */}
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 font-medium"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    {hasActiveFilter && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                        >
                            <X size={13} /> Clear Filters
                        </button>
                    )}

                    <span className="text-xs text-gray-400 ml-auto font-medium">{inventoryItems.length} items</span>
                </div>

                {/* Table */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md overflow-hidden">
                    <Box sx={{ height: 560, width: '100%' }}>
                        <DataGrid
                            rows={inventoryItems}
                            columns={columns}
                            loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            disableRowSelectionOnClick
                            sx={{
                                border: 'none',
                                backgroundColor: 'transparent',
                                '& .MuiDataGrid-columnHeaders': {
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.08))',
                                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                                    fontWeight: 700, color: '#475569',
                                },
                                '& .MuiDataGrid-row': {
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                    '&:hover': { backgroundColor: 'rgba(59,130,246,0.04)' },
                                },
                                '& .MuiDataGrid-cell': { borderBottom: 'none', color: '#334155', padding: '8px 12px' },
                                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(248,250,252,0.5)' },
                                '& .MuiDataGrid-columnSeparator': { display: 'none' },
                            }}
                        />
                    </Box>
                </div>
            </div>

            <MuiModal open={openModal} onClose={() => setOpenModal(false)} title="Add Inventory Item">
                <AddInventory onItemAdded={handleItemAdded} onCancel={() => setOpenModal(false)} />
            </MuiModal>

            <ConfirmDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ open: false, itemId: null })}
                onConfirm={confirmDelete}
                title="Confirm Delete"
                message="Are you sure you want to delete this inventory item? This action cannot be undone."
                confirmText="Delete" confirmColor="error"
            />

            <PromptDialog
                open={promptDialog.open}
                onClose={() => setPromptDialog({ open: false, itemId: null, adjustment: 0 })}
                onConfirm={confirmStockAdjustment}
                title={`${promptDialog.adjustment > 0 ? 'Add' : 'Remove'} Stock`}
                message={`Enter the quantity to ${promptDialog.adjustment > 0 ? 'add to' : 'remove from'} inventory:`}
                label="Quantity" type="number"
            />

            <AlertDialog
                open={alertDialog.open}
                onClose={() => setAlertDialog({ ...alertDialog, open: false })}
                title={alertDialog.title}
                message={alertDialog.message}
                severity={alertDialog.severity}
            />
        </Layout>
    );
}

export default Inventory;