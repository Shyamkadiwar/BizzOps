import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    Box, Typography, Chip, IconButton, Button, TextField, Grid,
    FormControlLabel, Checkbox
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Delete as DeleteIcon, CheckCircle as CheckIcon, Pending as PendingIcon } from '@mui/icons-material';
import MuiModal from "../shared/MuiModal";
import Layout from '../Layout.jsx';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import AlertDialog from '../shared/AlertDialog.jsx';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    const [formData, setFormData] = useState({
        item: '', qty: '', price: '', dateToDilivery: '', profitInPercent: '', done: false
    });

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/orders/get-order`,
                { withCredentials: true }
            );
            if (response.data.statusCode === 200) {
                setOrders((response.data.data || []).map(o => ({ ...o, id: o._id })));
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleSubmit = async () => {
        if (!formData.item || !formData.qty || !formData.price || !formData.dateToDilivery || !formData.profitInPercent) {
            setAlertDialog({ open: true, title: "Validation", message: "Please fill all required fields", severity: "warning" });
            return;
        }
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/orders/add-order`,
                { ...formData, qty: parseInt(formData.qty), price: parseFloat(formData.price), profitInPercent: parseFloat(formData.profitInPercent) },
                { withCredentials: true }
            );
            if (response.data.statusCode === 201) {
                setAlertDialog({ open: true, title: "Success", message: "Order added successfully", severity: "success" });
                setOpenModal(false);
                setFormData({ item: '', qty: '', price: '', dateToDilivery: '', profitInPercent: '', done: false });
                fetchOrders();
            }
        } catch (error) {
            setAlertDialog({ open: true, title: "Error", message: error.response?.data?.message || "Error adding order", severity: "error" });
        }
    };

    const handleToggleStatus = async (order) => {
        try {
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/orders/order/${order._id}/markDone`,
                {},
                { withCredentials: true }
            );
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const columns = [
        { field: 'item', headerName: 'Item', width: 180, filterable: true },
        {
            field: 'qty', headerName: 'Qty', width: 80, type: 'number',
            renderCell: (params) => <Chip label={params.value} color="primary" size="small" />
        },
        { field: 'price', headerName: 'Price', width: 120, type: 'number', valueFormatter: (value) => `₹${value?.toLocaleString() || 0}` },
        { field: 'cost', headerName: 'Cost', width: 120, type: 'number', valueFormatter: (value) => `₹${value?.toLocaleString() || 0}` },
        { field: 'sale', headerName: 'Sale', width: 120, type: 'number', valueFormatter: (value) => `₹${value?.toLocaleString() || 0}` },
        {
            field: 'profitInPercent', headerName: 'Profit %', width: 100, type: 'number',
            renderCell: (params) => (
                <Chip label={`${params.value}%`} color={params.value > 20 ? 'success' : params.value > 10 ? 'warning' : 'default'} size="small" />
            )
        },
        { field: 'profit', headerName: 'Profit', width: 120, type: 'number', valueFormatter: (value) => `₹${value?.toLocaleString() || 0}` },
        {
            field: 'dateToDilivery', headerName: 'Delivery Date', width: 130,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
        },
        {
            field: 'done', headerName: 'Status', width: 130,
            renderCell: (params) => (
                <Chip
                    icon={params.value ? <CheckIcon /> : <PendingIcon />}
                    label={params.value ? 'Delivered' : 'Pending'}
                    color={params.value ? 'success' : 'warning'}
                    size="small" variant="filled"
                    onClick={() => handleToggleStatus(params.row)}
                    sx={{ cursor: 'pointer' }}
                />
            )
        },
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                        <p className="text-sm text-gray-600">Track and manage orders</p>
                    </div>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}>Add Order</Button>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Records</h3>
                    <Box sx={{ height: 500, width: '100%' }}>
                        <DataGrid
                            rows={orders} columns={columns} loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]} disableRowSelectionOnClick
                            sx={{ border: 'none', '& .MuiDataGrid-cell': { borderBottom: '1px solid #f3f4f6' } }}
                        />
                    </Box>
                </div>
            </div>

            <MuiModal open={openModal} onClose={() => setOpenModal(false)} title="Add Order">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Item *" value={formData.item}
                                onChange={(e) => setFormData({ ...formData, item: e.target.value })} fullWidth required />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <TextField label="Quantity *" type="number" value={formData.qty}
                                onChange={(e) => setFormData({ ...formData, qty: e.target.value })} fullWidth required inputProps={{ min: 1 }} />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <TextField label="Price *" type="number" value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })} fullWidth required inputProps={{ min: 0, step: 0.01 }} />
                        </Grid>
                        <Grid item xs={6} sm={4}>
                            <TextField label="Profit % *" type="number" value={formData.profitInPercent}
                                onChange={(e) => setFormData({ ...formData, profitInPercent: e.target.value })} fullWidth required inputProps={{ min: 0, step: 0.01 }} />
                        </Grid>
                        <Grid item xs={6} sm={4}>
                            <TextField label="Delivery Date *" type="date" value={formData.dateToDilivery}
                                onChange={(e) => setFormData({ ...formData, dateToDilivery: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} required />
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                            <FormControlLabel
                                control={<Checkbox checked={formData.done} onChange={(e) => setFormData({ ...formData, done: e.target.checked })} />}
                                label="Delivered"
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                        <Button onClick={() => setOpenModal(false)} variant="outlined">Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained">Add Order</Button>
                    </Box>
                </Box>
            </MuiModal>

            <ConfirmDialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} message={confirmDialog.message} />
            <AlertDialog open={alertDialog.open} onClose={() => setAlertDialog({ ...alertDialog, open: false })}
                title={alertDialog.title} message={alertDialog.message} severity={alertDialog.severity} />
        </Layout>
    );
}

export default Orders;