import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Box,
    TextField,
    IconButton,
    Typography,
    Autocomplete,
    Paper,
    Switch,
    FormControlLabel,
    Chip,
    Button
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
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
        date: new Date().toISOString().split('T')[0],
        paid: false
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
                vendor: value.vendor?._id || value.vendor,
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
            date: formData.date,
            paid: formData.paid
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
                    date: new Date().toISOString().split('T')[0],
                    paid: false
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Row 1: Product Select (Full Width) */}
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

                {/* Row 2: Item Name | Category | Warehouse */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField
                        label="Item Name"
                        value={formData.item}
                        onChange={(e) => setFormData({ ...formData, item: e.target.value })}
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
                    <TextField
                        label="Warehouse"
                        value={formData.warehouse}
                        onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                        required
                        fullWidth
                    />
                </Box>

                {/* Row 3: Vendor (Full Width) */}
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

                {/* Row 4: Cost Price | Sale Price | Stock Quantity */}
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
                    <TextField
                        label="Stock Quantity"
                        type="number"
                        value={formData.stockRemain}
                        onChange={(e) => setFormData({ ...formData, stockRemain: e.target.value })}
                        required
                        fullWidth
                        inputProps={{ min: 0 }}
                    />
                </Box>

                {/* Row 5: Date | Paid Toggle | Total Cost */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                    <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: formData.paid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid',
                        borderColor: formData.paid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        boxShadow: 'none'
                    }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.paid}
                                    onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                                    color={formData.paid ? 'success' : 'warning'}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>
                                        Bill {formData.paid ? 'Paid' : 'Unpaid'}
                                    </Typography>
                                    <Chip
                                        label={formData.paid ? 'PAID' : 'UNPAID'}
                                        sx={{ 
                                            background: formData.paid ? '#10b981' : '#ef4444', 
                                            color: '#fff', fontSize: '11px', fontWeight: 700 
                                        }}
                                        size="small"
                                    />
                                </Box>
                            }
                        />
                    </Paper>
                    <Paper sx={{ p: 2, background: '#4f46e5', display: 'flex', alignItems: 'center', borderRadius: '12px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' }}>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                            Total Cost: ₹{totalCost.toLocaleString()}
                        </Typography>
                    </Paper>
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
                        background: '#4f46e5',
                        color: '#fff', textTransform: 'none', fontWeight: 600, borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                        px: 4, py: 1,
                        '&:hover': { background: '#4338ca' }
                    }}>
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
