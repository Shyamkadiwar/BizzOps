import axios from "axios";
import React, { useState } from "react";
import {
    Box,
    TextField,
    Button,
    Grid,
    IconButton,
    Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
            <Grid container spacing={2}>
                {/* Product Name */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Product Name *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        fullWidth
                    />
                </Grid>

                {/* Category */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Category *"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        fullWidth
                    />
                </Grid>

                {/* Cost */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Cost Price *"
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        required
                        fullWidth
                        inputProps={{ min: 0, step: "0.01" }}
                    />
                </Grid>

                {/* Sale Price */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Sale Price *"
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        required
                        fullWidth
                        inputProps={{ min: 0, step: "0.01" }}
                    />
                </Grid>

                {/* Vendor */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Vendor *"
                        value={formData.vendor}
                        onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                        required
                        fullWidth
                    />
                </Grid>

                {/* Description */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        fullWidth
                        multiline
                        rows={1}
                    />
                </Grid>

                {/* Taxes Section */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">Taxes</Typography>
                        <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={handleAddTax}
                        >
                            Add Tax
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {formData.taxes.map((tax, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    label="Tax Name"
                                    value={tax.name}
                                    onChange={(e) => handleTaxChange(index, 'name', e.target.value)}
                                    size="small"
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    label="Rate (%)"
                                    type="number"
                                    value={tax.rate}
                                    onChange={(e) => handleTaxChange(index, 'rate', e.target.value)}
                                    size="small"
                                    sx={{ width: 120 }}
                                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                                />
                                <IconButton onClick={() => handleRemoveTax(index)} size="small" color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                {onCancel && (
                    <Button onClick={onCancel} variant="outlined">
                        Cancel
                    </Button>
                )}
                <Button type="submit" variant="contained">
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
