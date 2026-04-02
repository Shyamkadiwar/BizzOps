import axios from "axios";
import React, { useState, useEffect } from "react";
import {
    Box,
    TextField,
    IconButton,
    Typography,
    Autocomplete,
    Button
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
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Taxes (Optional)</Typography>
                        <Button 
                            type="button" 
                            onClick={handleAddTax}
                            startIcon={<Plus size={16} />}
                            sx={{
                                color: '#0f172a', background: '#f1f5f9', borderRadius: '8px',
                                textTransform: 'none', fontWeight: 600, px: 2,
                                '&:hover': { background: '#e2e8f0' }
                            }}
                        >
                            Add Tax
                        </Button>
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
                            <IconButton 
                                onClick={() => handleRemoveTax(index)} 
                                size="small" 
                                sx={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', height: 40, width: 40, alignSelf: 'center', '&:hover': { background: 'rgba(239, 68, 68, 0.2)' } }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4, pt: 3, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                {onCancel && (
                    <Button type="button" onClick={onCancel}
                        sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600, px: 3 }}>
                        Cancel
                    </Button>
                )}
                <Button type="submit"
                    sx={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        color: '#fff', textTransform: 'none', fontWeight: 600, borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                        px: 4, py: 1,
                        '&:hover': { background: 'linear-gradient(135deg, #000000 0%, #0f172a 100%)' }
                    }}>
                    Create Product
                </Button>
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
