import axios from "axios";
import React, { useState, useEffect } from "react";
import {
    Box,
    TextField,
    IconButton,
    Typography,
    Autocomplete
} from '@mui/material';
import { Plus } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/Delete';
import AlertDialog from '../shared/AlertDialog.jsx';

function AddProduct({ onProductAdded, onCancel }) {
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        cost: "",
        salePrice: "",
        vendor: "",
        description: "",
        taxes: []
    });

    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });
    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/list`,
                { withCredentials: true }
            );
            setVendors(response.data.data.vendors || []);
        } catch (error) {
            console.error("Error fetching vendors:", error);
            setVendors([]);
        }
    };


    const handleAddTax = () => {
        setFormData({
            ...formData,
            taxes: [...formData.taxes, { name: "", rate: 0 }]
        });
    };

    const handleRemoveTax = (index) => {
        setFormData({
            ...formData,
            taxes: formData.taxes.filter((_, i) => i !== index)
        });
    };

    const handleTaxChange = (index, field, value) => {
        const updatedTaxes = [...formData.taxes];
        updatedTaxes[index][field] = value;
        setFormData({ ...formData, taxes: updatedTaxes });
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

        const data = {
            name: formData.name,
            category: formData.category,
            cost: parseFloat(formData.cost),
            salePrice: parseFloat(formData.salePrice),
            vendor: formData.vendor,
            description: formData.description,
            taxes: formData.taxes
        };

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/create-product`,
                data,
                { withCredentials: true }
            );

            if (response.status === 201) {
                setAlertDialog({
                    open: true,
                    title: "Success",
                    message: "Product created successfully!",
                    severity: "success"
                });

                setTimeout(() => {
                    onProductAdded(response.data.data);
                }, 1500);

                // Reset form
                setFormData({
                    name: "",
                    category: "",
                    cost: "",
                    salePrice: "",
                    vendor: "",
                    description: "",
                    taxes: []
                });
            }
        } catch (error) {
            console.error("Error creating product:", error.response?.data || error.message);
            setAlertDialog({
                open: true,
                title: "Error",
                message: error.response?.data?.message || "Error creating product",
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
                        label="Product Name *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Category *"
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
                                label="Vendor *"
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

                {/* Row 2: Cost Price | Sale Price | Description */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField
                        label="Cost Price *"
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        required
                        fullWidth
                        inputProps={{ min: 0, step: "0.01" }}
                    />
                    <TextField
                        label="Sale Price *"
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        required
                        fullWidth
                        inputProps={{ min: 0, step: "0.01" }}
                    />
                    <TextField
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        fullWidth
                    />
                </Box>

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
                {onCancel && (
                    <button type="button" onClick={onCancel}
                        className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700">
                        Cancel
                    </button>
                )}
                <button type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium text-white">
                    Create Product
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
}

export default AddProduct;
