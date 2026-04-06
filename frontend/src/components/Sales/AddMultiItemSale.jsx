import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    TextField,
    Autocomplete,
    Paper,
    Typography,
    FormControlLabel,
    Checkbox,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button
} from '@mui/material';
import { Plus } from 'lucide-react';
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        setIsSubmitting(true);

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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Row 1: Product | Quantity | Add Button */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 2, alignItems: 'start' }}>
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
                    <Button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!currentItem.product || !currentItem.qty}
                        startIcon={<Plus size={16} />}
                        sx={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            color: '#fff', textTransform: 'none', fontWeight: 600, borderRadius: '10px',
                            px: 3, py: 1.5, height: '56px',
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                            '&:hover': { background: 'linear-gradient(135deg, #000000 0%, #0f172a 100%)' },
                            '&.Mui-disabled': { background: '#cbd5e1', color: '#94a3b8' }
                        }}
                    >
                        Add
                    </Button>
                </Box>

                {/* Items List */}
                {items.length > 0 && (
                    <Box sx={{ p: 2.5, borderRadius: '16px', background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 2 }}>
                            Items Included ({items.length})
                        </Typography>
                        <TableContainer sx={{ background: 'transparent' }}>
                            <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid rgba(0,0,0,0.06)' } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Product</TableCell>
                                        <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Qty</TableCell>
                                        <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Price</TableCell>
                                        <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Total</TableCell>
                                        <TableCell align="center" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{item.productName}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>{item.qty}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 500, color: '#475569' }}>₹{item.price.toLocaleString()}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>₹{(item.price * item.qty).toLocaleString()}</TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveItem(index)}
                                                    sx={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', height: 32, width: 32, '&:hover': { background: 'rgba(239, 68, 68, 0.2)' } }}
                                                >
                                                    <DeleteIcon fontSize="small"  />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Totals */}
                        <Box sx={{ mt: 3, p: 2.5, background: 'rgba(255, 255, 255, 0.8)', borderRadius: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2, border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sale</Typography>
                                <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 800, mt: 0.5 }}>₹{totalSale.toLocaleString()}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Cost</Typography>
                                <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mt: 0.5 }}>₹{totalCost.toLocaleString()}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Profit</Typography>
                                <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 800, mt: 0.5 }}>₹{totalProfit.toLocaleString()}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Margin</Typography>
                                <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 800, mt: 0.5 }}>{profitPercent.toFixed(2)}%</Typography>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Row 2: Date | Paid | Customer Select */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
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
                </Box>

                {/* Row 3: Manual Customer Name (if no customer selected) */}
                <TextField
                    label="Or Enter Customer Name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    fullWidth
                    disabled={!!formData.customer}
                />

                {/* Row 4: New Customer Details (if typing new customer name) */}
                {!formData.customer && formData.customerName && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Customer Email"
                            type="email"
                            value={formData.customerEmail}
                            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Customer Phone"
                            value={formData.customerPhone}
                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Customer City"
                            value={formData.customerCity}
                            onChange={(e) => setFormData({ ...formData, customerCity: e.target.value })}
                            fullWidth
                        />
                    </Box>
                )}
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
                    disabled={items.length === 0 || isSubmitting}
                    sx={{
                        background: '#4f46e5',
                        color: '#fff', textTransform: 'none', fontWeight: 600, borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                        px: 4, py: 1,
                        '&:hover': { background: '#4338ca' },
                        '&.Mui-disabled': { background: '#cbd5e1', color: '#94a3b8', boxShadow: 'none' }
                    }}
                >
                    {isSubmitting ? 'Creating...' : `Create Sale & Invoice (${items.length} items)`}
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
