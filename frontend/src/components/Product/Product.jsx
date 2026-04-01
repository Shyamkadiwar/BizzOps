import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Autocomplete, TextField } from '@mui/material';
import { Plus } from 'lucide-react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import ProfessionalDataGrid from '../shared/ProfessionalDataGrid';
import MuiModal from '../shared/MuiModal';
import AddProduct from './AddProduct';
import axios from 'axios';
import Layout from '../Layout';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';

const Product = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [vendors, setVendors] = useState([]);
    const [selectedVendorFilter, setSelectedVendorFilter] = useState(null);

    const fetchProducts = async (vendorId = null) => {
        setLoading(true);
        try {
            let url;
            if (vendorId) {
                url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/by-vendor/${vendorId}`;
            } else {
                url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/get-products?limit=1000`;
            }
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                withCredentials: true
            });
            const productsData = response.data.data.products || [];
            setProducts(productsData.map(product => ({ ...product, id: product._id })));
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
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                    withCredentials: true
                }
            );
            setVendors(response.data.data.vendors || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchVendors();
    }, []);

    const handleVendorFilterChange = (event, value) => {
        setSelectedVendorFilter(value);
        if (value) {
            fetchProducts(value._id);
        } else {
            fetchProducts();
        }
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setOpenModal(true);
    };

    const handleDelete = async (id) => {
        setConfirmDialog({
            open: true,
            title: "Delete Product",
            message: "Are you sure you want to delete this product?",
            onConfirm: async () => {
                try {
                    await axios.delete(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/delete-product/${id}`,
                        {
                            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                            withCredentials: true
                        }
                    );
                    fetchProducts(selectedVendorFilter?._id || null);
                } catch (error) {
                    console.error('Error deleting product:', error);
                    alert('Error deleting product');
                }
                setConfirmDialog({ ...confirmDialog, open: false });
            }
        });
    };

    const columns = [
        { field: 'name', headerName: 'Product Name', width: 180, filterable: true },
        { field: 'category', headerName: 'Category', width: 150, filterable: true },
        {
            field: 'cost',
            headerName: 'Cost Price',
            width: 120,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`
        },
        {
            field: 'salePrice',
            headerName: 'Sale Price',
            width: 120,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`
        },
        {
            field: 'margin',
            headerName: 'Margin %',
            width: 100,
            type: 'number',
            valueGetter: (value, row) => {
                const cost = row.cost || 0;
                const sale = row.salePrice || 0;
                return cost > 0 ? ((sale - cost) / cost * 100).toFixed(2) : 0;
            },
            renderCell: (params) => (
                <Chip
                    label={`${params.value}%`}
                    color={params.value > 30 ? 'success' : params.value > 15 ? 'warning' : 'default'}
                    size="small"
                />
            )
        },
        {
            field: 'vendor',
            headerName: 'Vendor',
            width: 150,
            filterable: true,
            valueGetter: (value, row) => {
                return row.vendor?.name || 'N/A';
            }
        },
        {
            field: 'taxes',
            headerName: 'Taxes',
            width: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {params.value && params.value.length > 0 ? (
                        params.value.map((tax, idx) => (
                            <Chip
                                key={idx}
                                label={`${tax.name}: ${tax.rate}%`}
                                size="small"
                                variant="outlined"
                            />
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleEdit(params.row)} size="small" color="primary">
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(params.row._id)} size="small" color="error">
                        <DeleteIcon />
                    </IconButton>
                </Box>
            )
        }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Product Catalog
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Autocomplete
                            options={vendors}
                            getOptionLabel={(option) => option.name || ''}
                            value={selectedVendorFilter}
                            onChange={handleVendorFilterChange}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Filter by Vendor"
                                    placeholder="All Vendors"
                                    size="small"
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <FilterListIcon sx={{ color: 'action.active', mr: 0.5, fontSize: 20 }} />
                                                {params.InputProps.startAdornment}
                                            </>
                                        )
                                    }}
                                />
                            )}
                            sx={{ width: 280 }}
                        />
                        <button
                            onClick={() => {
                                setSelectedProduct(null);
                                setOpenModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600/90 hover:to-indigo-600/90 transition-all duration-200 text-sm font-medium text-white">
                            <Plus size={16} /> Add Product
                        </button>
                    </Box>
                </Box>

                {selectedVendorFilter && (
                    <Box sx={{ mb: 2 }}>
                        <Chip
                            label={`Showing products from: ${selectedVendorFilter.name}`}
                            onDelete={() => handleVendorFilterChange(null, null)}
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                )}

                <ProfessionalDataGrid
                    rows={products}
                    columns={columns}
                    loading={loading}
                    onAdd={() => {
                        setSelectedProduct(null);
                        setOpenModal(true);
                    }}
                    pageSize={10}
                />
            </div>

            <MuiModal
                open={openModal}
                onClose={() => {
                    setOpenModal(false);
                    setSelectedProduct(null);
                }}
                title={selectedProduct ? 'Edit Product' : 'Add Product'}
            >
                <AddProduct
                    product={selectedProduct}
                    onSuccess={() => {
                        setOpenModal(false);
                        setSelectedProduct(null);
                        fetchProducts(selectedVendorFilter?._id || null);
                    }}
                    onCancel={() => {
                        setOpenModal(false);
                        setSelectedProduct(null);
                    }}
                />
            </MuiModal>

            <ConfirmDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />
        </Layout>
    );
};

export default Product;
