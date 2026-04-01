import React, { useState, useEffect } from 'react';
import { Box, TextField, IconButton, Autocomplete, Typography } from '@mui/material';
import { Plus } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import AlertDialog from '../shared/AlertDialog.jsx';

const AddProduct = ({ product, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        cost: '',
        salePrice: '',
        vendor: '',
        description: '',
        taxes: []
    });

    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });
    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        fetchVendors();
        if (product) {
            setFormData({
                name: product.name || '',
                category: product.category || '',
                cost: product.cost || '',
                salePrice: product.salePrice || '',
                vendor: product.vendor?._id || product.vendor || '',
                description: product.description || '',
                taxes: product.taxes || []
            });
        }
    }, [product]);

    const fetchVendors = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/list`,
                { withCredentials: true }
            );
            setVendors(response.data.data.vendors || []);
        } catch (error) {
            console.error("Error fetching vendors:", error);
            setVendors([]); // Set empty array on error
        }
    };

    const handleAddTax = () => {
        setFormData({
            ...formData,
            taxes: [...formData.taxes, { name: '', rate: 0 }]
        });
    };

    const handleTaxChange = (index, field, value) => {
        const newTaxes = [...formData.taxes];
        newTaxes[index][field] = field === 'rate' ? parseFloat(value) || 0 : value;
        setFormData({ ...formData, taxes: newTaxes });
    };

    const handleRemoveTax = (index) => {
        const newTaxes = formData.taxes.filter((_, i) => i !== index);
        setFormData({ ...formData, taxes: newTaxes });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.category || !formData.cost || !formData.salePrice || !formData.vendor) {
            setAlertDialog({
                open: true,
                title: "Validation Error",
                message: "Please fill all required fields",
                severity: "warning"
            });
            return;
        }

        try {
            const url = product
                ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/update-product/${product._id}`
                : `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/add-product`;

            const method = product ? 'put' : 'post';

            await axios[method](url, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                },
                withCredentials: true
            });

            setAlertDialog({
                open: true,
                title: "Success",
                message: product ? 'Product updated successfully' : 'Product added successfully',
                severity: "success"
            });

            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (error) {
            console.error('Error saving product:', error);
            setAlertDialog({
                open: true,
                title: "Error",
                message: error.response?.data?.message || 'Error saving product',
                severity: "error"
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Row 1: Product Name | Category | Vendor */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField
                        label="Product Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        fullWidth
                    />
                    <Autocomplete
                        options={vendors}
                        getOptionLabel={(option) => option.name || ''}
                        value={vendors.find(v => v._id === formData.vendor) || null}
                        onChange={(event, value) => setFormData({ ...formData, vendor: value?._id || '' })}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Vendor"
                                required
                                placeholder="Select vendor..."
                            />
                        )}
                        freeSolo
                        onInputChange={(event, newInputValue, reason) => {
                            if (reason === 'input' && !vendors.find(v => v.name === newInputValue)) {
                                setFormData({ ...formData, vendor: newInputValue });
                            }
                        }}
                    />
                </Box>

                {/* Row 2: Cost Price | Sale Price */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField
                        label="Cost Price"
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        required
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                        label="Sale Price"
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        required
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                </Box>

                {/* Row 3: Description (Full Width) */}
                <TextField
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={3}
                    fullWidth
                />

                {/* Taxes Section */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">Taxes (Optional)</Typography>
                        <button type="button" onClick={handleAddTax}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs font-medium text-gray-600">
                            <Plus size={14} /> Add Tax
                        </button>
                    </Box>
                    {formData.taxes.map((tax, index) => (
                        <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 1, mb: 1 }}>
                            <TextField
                                label="Tax Name (e.g., GST, CGST)"
                                value={tax.name}
                                onChange={(e) => handleTaxChange(index, 'name', e.target.value)}
                                size="small"
                                fullWidth
                            />
                            <TextField
                                label="Rate (%)"
                                type="number"
                                value={tax.rate}
                                onChange={(e) => handleTaxChange(index, 'rate', e.target.value)}
                                size="small"
                                fullWidth
                                inputProps={{ min: 0, max: 100, step: 0.01 }}
                            />
                            <IconButton onClick={() => handleRemoveTax(index)} size="small" color="error">
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                <button type="button" onClick={onCancel}
                    className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700">
                    Cancel
                </button>
                <button type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium text-white">
                    {product ? 'Update Product' : 'Add Product'}
                </button>
            </Box>

            {/* Alert Dialog */}
            <AlertDialog
                open={alertDialog.open}
                onClose={() => setAlertDialog({ ...alertDialog, open: false })}
                title={alertDialog.title}
                message={alertDialog.message}
                severity={alertDialog.severity}
            />
        </Box>
    );
};

export default AddProduct;
