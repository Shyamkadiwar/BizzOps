import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    TextField,
    Button,
    Grid,
    Autocomplete,
    Paper,
    Typography,
    Chip,
    FormControlLabel,
    Checkbox,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AlertDialog from '../shared/AlertDialog.jsx';

function AddMultiItemSale({ addNewSale, onCancel }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        paid: false,
        customer: null,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerCity: ""
    });

    const [currentItem, setCurrentItem] = useState({
        product: "",
        qty: ""
    });

    const [items, setItems] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    // Calculated totals
    const totalSale = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalCost = items.reduce((sum, item) => sum + (item.cost * item.qty), 0);
    const totalProfit = totalSale - totalCost;
    const profitPercent = totalCost > 0 ? ((totalProfit / totalCost) * 100) : 0;

    const fetchInventory = useCallback(async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/get-item?limit=100`,
                { withCredentials: true }
            );
            setInventory(response.data.data.inventoryItems || response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch inventory items:', error);
        }
    }, []);

    const fetchCustomers = useCallback(async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/get-customer?limit=100`,
                { withCredentials: true }
            );
            setCustomers(response.data.data.customers || []);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
        fetchCustomers();
    }, [fetchInventory, fetchCustomers]);

    useEffect(() => {
        if (currentItem.product) {
            const item = inventory.find(inv => inv._id === currentItem.product);
            setSelectedInventoryItem(item);
        } else {
            setSelectedInventoryItem(null);
        }
    }, [currentItem.product, inventory]);

    const handleAddItem = () => {
        if (!currentItem.product || !currentItem.qty) {
            setAlertDialog({
                open: true,
                title: "Validation Error",
                message: "Please select a product and enter quantity",
                severity: "warning"
            });
            return;
        }

        if (!selectedInventoryItem) {
            setAlertDialog({
                open: true,
                title: "Validation Error",
                message: "Please select a valid product",
                severity: "warning"
            });
            return;
        }

        const qty = parseInt(currentItem.qty);
        if (qty > selectedInventoryItem.stockRemain) {
            setAlertDialog({
                open: true,
                title: "Stock Error",
                message: `Not enough stock! Only ${selectedInventoryItem.stockRemain} units available.`,
                severity: "error"
            });
            return;
        }

        // Check if item already exists in the list
        const existingItemIndex = items.findIndex(item => item.product === currentItem.product);

        if (existingItemIndex >= 0) {
            // Update quantity
            const updatedItems = [...items];
            updatedItems[existingItemIndex].qty += qty;
            setItems(updatedItems);
        } else {
            // Add new item
            const newItem = {
                product: currentItem.product,
                productName: selectedInventoryItem.item,
                qty: qty,
                price: selectedInventoryItem.salePrice,
                cost: selectedInventoryItem.cost,
                stockAvailable: selectedInventoryItem.stockRemain
            };
            setItems([...items, newItem]);
        }

        // Reset current item
        setCurrentItem({ product: "", qty: "" });
        setSelectedInventoryItem(null);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (items.length === 0) {
            setAlertDialog({
                open: true,
                title: "Validation Error",
                message: "Please add at least one item",
                severity: "warning"
            });
            return;
        }

        const data = {
            items: items.map(item => ({
                product: item.product,
                qty: item.qty
            })),
            date: formData.date,
            paid: formData.paid,
            customer: formData.customer || undefined,
            customerName: formData.customerName || undefined,
            customerEmail: formData.customerEmail || undefined,
            customerPhone: formData.customerPhone || undefined,
            customerCity: formData.customerCity || undefined
        };

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/add-sale`,
                data,
                { withCredentials: true }
            );

            if (response.status === 201) {
                setAlertDialog({
                    open: true,
                    title: "Success",
                    message: "Multi-item sale and invoice created successfully!",
                    severity: "success"
                });

                setTimeout(() => {
                    addNewSale(response.data.data.sale);
                }, 1500);

                // Reset form
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    paid: false,
                    customer: null,
                    customerName: "",
                    customerEmail: "",
                    customerPhone: "",
                    customerCity: ""
                });
                setItems([]);
                setCurrentItem({ product: "", qty: "" });
            }
        } catch (error) {
            console.error("Error while adding multi-item sale:", error.response?.data || error.message);
            setAlertDialog({
                open: true,
                title: "Error",
                message: error.response?.data?.message || "Error adding multi-item sale",
                severity: "error"
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Grid container spacing={2}>
                {/* Product Selection */}
                <Grid item xs={12} sm={6}>
                    <Autocomplete
                        options={inventory}
                        getOptionLabel={(option) => `${option.item} - Stock: ${option.stockRemain} - ₹${option.salePrice}`}
                        value={inventory.find(item => item._id === currentItem.product) || null}
                        onChange={(event, value) => {
                            setCurrentItem({ ...currentItem, product: value?._id || "" });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Select Product"
                                placeholder="Search products..."
                            />
                        )}
                    />
                </Grid>

                {/* Quantity */}
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Quantity"
                        type="number"
                        value={currentItem.qty}
                        onChange={(e) => setCurrentItem({ ...currentItem, qty: e.target.value })}
                        fullWidth
                        inputProps={{
                            min: 1,
                            max: selectedInventoryItem?.stockRemain || 999999
                        }}
                        helperText={selectedInventoryItem ? `Available: ${selectedInventoryItem.stockRemain}` : ''}
                    />
                </Grid>

                {/* Add Item Button */}
                <Grid item xs={12} sm={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ height: '56px' }}
                        onClick={handleAddItem}
                        startIcon={<AddIcon />}
                        disabled={!currentItem.product || !currentItem.qty}
                    >
                        Add
                    </Button>
                </Grid>

                {/* Items List */}
                {items.length > 0 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Items Added ({items.length})
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Product</TableCell>
                                            <TableCell align="right">Qty</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                            <TableCell align="center">Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.productName}</TableCell>
                                                <TableCell align="right">{item.qty}</TableCell>
                                                <TableCell align="right">₹{item.price.toLocaleString()}</TableCell>
                                                <TableCell align="right">₹{(item.price * item.qty).toLocaleString()}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Totals */}
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                <Grid container spacing={1}>
                                    <Grid item xs={6} sm={3}>
                                        <Typography variant="body2" color="text.secondary">Total Sale:</Typography>
                                        <Typography variant="h6" color="primary">₹{totalSale.toLocaleString()}</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Typography variant="body2" color="text.secondary">Total Cost:</Typography>
                                        <Typography variant="h6">₹{totalCost.toLocaleString()}</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Typography variant="body2" color="text.secondary">Profit:</Typography>
                                        <Typography variant="h6" color="success.dark">₹{totalProfit.toLocaleString()}</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Typography variant="body2" color="text.secondary">Profit %:</Typography>
                                        <Typography variant="h6" color="success.dark">{profitPercent.toFixed(2)}%</Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    </Grid>
                )}

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

                {/* Paid Status */}
                <Grid item xs={12} sm={6}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={formData.paid}
                                onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                                color="success"
                            />
                        }
                        label="Mark as Paid"
                    />
                </Grid>

                {/* Customer Selection */}
                <Grid item xs={12} sm={6}>
                    <Autocomplete
                        options={customers}
                        getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                        value={customers.find(c => c._id === formData.customer) || null}
                        onChange={(event, value) => {
                            setFormData({
                                ...formData,
                                customer: value?._id || null,
                                customerName: value?.name || ""
                            });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Select Customer (Optional)"
                                placeholder="Search customers..."
                            />
                        )}
                    />
                </Grid>

                {/* Manual Customer Name */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Or Enter Customer Name"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        fullWidth
                        disabled={!!formData.customer}
                    />
                </Grid>

                {/* Customer Details (if new customer) */}
                {!formData.customer && formData.customerName && (
                    <>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Customer Email"
                                type="email"
                                value={formData.customerEmail}
                                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Customer Phone"
                                value={formData.customerPhone}
                                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Customer City"
                                value={formData.customerCity}
                                onChange={(e) => setFormData({ ...formData, customerCity: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                    </>
                )}
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                {onCancel && (
                    <Button onClick={onCancel} variant="outlined">
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="contained"
                    disabled={items.length === 0}
                >
                    Create Sale & Invoice ({items.length} items)
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

export default AddMultiItemSale;
