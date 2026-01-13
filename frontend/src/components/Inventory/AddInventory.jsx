import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Box,
    TextField,
    Button,
    Grid,
    IconButton,
    Typography,
    Autocomplete,
    Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AlertDialog from '../shared/AlertDialog.jsx';

function AddInventory({ onItemAdded, onCancel }) {
    const [formData, setFormData] = useState({
        product: null,
        item: "",
        category: "",
        warehouse: "",
        cost: "",
        salePrice: "",
        vendor: "",
        taxes: [],
        stockRemain: "",
        date: new Date().toISOString().split('T')[0]
    });

    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [totalCost, setTotalCost] = useState(0);
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    // Fetch products and vendors for autocomplete
    useEffect(() => {
        fetchProducts();
        fetchVendors();
    }, []);

    // Calculate total cost whenever cost or stockRemain changes
    useEffect(() => {
        const cost = parseFloat(formData.cost) || 0;
        const stock = parseFloat(formData.stockRemain) || 0;
        setTotalCost(cost * stock);
    }, [formData.cost, formData.stockRemain]);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/get-products?limit=100`,
                { withCredentials: true }
            );
            setProducts(response.data.data.products || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

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

    const handleProductSelect = (event, value) => {
        if (value) {
            setFormData({
                ...formData,
                product: value._id,
                item: value.name,
                category: value.category,
                cost: value.cost,
                salePrice: value.salePrice,
                vendor: value.vendor,
                taxes: value.taxes || []
            });
        } else {
            setFormData({
                ...formData,
                product: null
            });
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

    async function handleAddInventory(e) {
        e.preventDefault();

        if (!formData.item || !formData.category || !formData.warehouse ||
            !formData.cost || !formData.salePrice || !formData.vendor ||
            !formData.stockRemain || !formData.date) {
            setAlertDialog({
                open: true,
                title: "Validation Error",
                message: "Please fill all required fields",
                severity: "warning"
            });
            return;
        }

        const data = {
            product: formData.product || undefined,
            item: formData.item,
            category: formData.category,
            warehouse: formData.warehouse,
            cost: parseFloat(formData.cost),
            salePrice: parseFloat(formData.salePrice),
            vendor: formData.vendor,
            taxes: formData.taxes,
            stockRemain: parseInt(formData.stockRemain),
            date: formData.date
        };

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/add-item`,
                data,
                { withCredentials: true }
            );

            if (response.status === 200 && response.data && response.data.data) {
                setAlertDialog({
                    open: true,
                    title: "Success",
                    message: response.data.message || "Item added to inventory successfully!",
                    severity: "success"
                });

                // Call parent callback after a short delay to show the success message
                setTimeout(() => {
                    onItemAdded(response.data.data);
                }, 1500);

                // Reset form
                setFormData({
                    product: null,
                    item: "",
                    category: "",
                    warehouse: "",
                    cost: "",
                    salePrice: "",
                    vendor: "",
                    taxes: [],
                    stockRemain: "",
                    date: new Date().toISOString().split('T')[0]
                });
            }
        } catch (error) {
            console.error("Error while adding item:", error.response?.data || error.message);
            setAlertDialog({
                open: true,
                title: "Error",
                message: error.response?.data?.message || "Error adding item to inventory",
                severity: "error"
            });
        }
    }

    return (
        <Box component="form" onSubmit={handleAddInventory} sx={{ p: 2 }}>
            <Grid container spacing={2}>
                {/* Product Autocomplete (Optional) */}
                <Grid item xs={12}>
                    <Autocomplete
                        options={products}
                        getOptionLabel={(option) => `${option.name} - ${option.category}`}
                        onChange={handleProductSelect}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Select Product (Optional - Auto-fills fields)"
                                placeholder="Search products..."
                            />
                        )}
                    />
                </Grid>

                {/* Item Name */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Item Name"
                        value={formData.item}
                        onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                        required
                        fullWidth
                    />
                </Grid>

                {/* Category */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        fullWidth
                    />
                </Grid>

                {/* Warehouse */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Warehouse"
                        value={formData.warehouse}
                        onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                        required
                        fullWidth
                    />
                </Grid>

                {/* Vendor */}
                <Grid item xs={12} sm={6}>
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
                                placeholder="Select or type vendor name..."
                            />
                        )}
                        freeSolo
                        onInputChange={(event, newInputValue, reason) => {
                            if (reason === 'input' && !vendors.find(v => v.name === newInputValue)) {
                                setFormData({ ...formData, vendor: newInputValue });
                            }
                        }}
                    />
                </Grid>

                {/* Cost Price */}
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Cost Price"
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        required
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                </Grid>

                {/* Sale Price */}
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Sale Price"
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        required
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                </Grid>

                {/* Stock Quantity */}
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Stock Quantity"
                        type="number"
                        value={formData.stockRemain}
                        onChange={(e) => setFormData({ ...formData, stockRemain: e.target.value })}
                        required
                        fullWidth
                        inputProps={{ min: 0 }}
                    />
                </Grid>

                {/* Date */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>

                {/* Total Cost Display */}
                <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: 'primary.light', height: '100%', display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ color: 'primary.contrastText' }}>
                            Total Cost: ₹{totalCost.toLocaleString()}
                        </Typography>
                    </Paper>
                </Grid>

                {/* Taxes Section */}
                <Grid item xs={12}>
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">Taxes (Optional)</Typography>
                            <Button startIcon={<AddIcon />} onClick={handleAddTax} size="small" variant="outlined">
                                Add Tax
                            </Button>
                        </Box>
                        {formData.taxes.map((tax, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
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
                    Add to Inventory
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

export default AddInventory;
