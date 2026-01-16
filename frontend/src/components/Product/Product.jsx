import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/get-products?limit=1000`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    withCredentials: true
                }
            );
            const productsData = response.data.data.products || [];
            setProducts(productsData.map(product => ({ ...product, id: product._id })));
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

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
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                            },
                            withCredentials: true
                        }
                    );
                    fetchProducts();
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
                // Handle vendor as object (populated) or string (ID)
                if (typeof row.vendor === 'object' && row.vendor !== null) {
                    return row.vendor.name || row.vendor._id || 'N/A';
                }
                return row.vendor || 'N/A';
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
            <Box sx={{ p: 6, background: '#F5F5F5' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Product Catalog
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setSelectedProduct(null);
                            setOpenModal(true);
                        }}
                    >
                        Add Product
                    </Button>
                </Box>

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
            </Box>

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
                        fetchProducts();
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
