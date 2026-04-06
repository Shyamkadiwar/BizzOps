import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
    Box, Typography, Chip, IconButton, TextField, Grid,
    FormControlLabel, Checkbox
} from '@mui/material';
import { Delete as DeleteIcon, CheckCircle as CheckIcon, Pending as PendingIcon } from '@mui/icons-material';
import { Plus, Search, X, ShoppingBag, IndianRupee, TrendingUp, CheckCircle } from 'lucide-react';
import MuiModal from "../shared/MuiModal";
import Layout from '../Layout.jsx';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import AlertDialog from '../shared/AlertDialog.jsx';
import ProfessionalDataGrid from "../shared/ProfessionalDataGrid.jsx";

function Orders() {
    const [allOrders, setAllOrders] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, delivered, pending

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
                const data = (response.data.data || []).map(o => ({ ...o, id: o._id }));
                
                // Sort by delivery date descending
                data.sort((a,b) => new Date(b.dateToDilivery) - new Date(a.dateToDilivery));
                
                setAllOrders(data);
                setOrders(data);
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
    
    // Apply Filters
    useEffect(() => {
        let filtered = [...allOrders];

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(o => 
                (o.item && o.item.toLowerCase().includes(q))
            );
        }

        if (statusFilter === 'delivered') filtered = filtered.filter(o => o.done);
        else if (statusFilter === 'pending') filtered = filtered.filter(o => !o.done);

        setOrders(filtered);
    }, [search, statusFilter, allOrders]);

    const stats = useMemo(() => {
        // Compute from current filtered orders
        const totalItems = orders.length;
        const totalValue = orders.reduce((s, o) => s + (o.sale || (o.price * o.qty) || 0), 0);
        const totalProfit = orders.reduce((s, o) => s + (o.profit || 0), 0);
        const deliveredCount = orders.filter(o => o.done).length;

        return {
            totalItems,
            totalValue,
            totalProfit,
            deliveredCount
        };
    }, [orders]);

    const clearFilters = () => { setSearch(''); setStatusFilter('all'); };
    const hasActiveFilter = search || statusFilter !== 'all';

    const columns = [
        { field: 'item', headerName: 'Item', width: 220, filterable: true },
        {
            field: 'qty', headerName: 'Qty', width: 80, type: 'number',
            renderCell: (params) => <Chip label={params.value} color="primary" size="small" variant="outlined" />
        },
        { field: 'price', headerName: 'Price', width: 120, type: 'number', valueFormatter: (value) => `₹${value?.toLocaleString() || 0}` },
        { field: 'cost', headerName: 'Cost', width: 120, type: 'number', valueFormatter: (value) => `₹${value?.toLocaleString() || 0}` },
        { field: 'sale', headerName: 'Sale', width: 120, type: 'number', valueFormatter: (value) => `₹${value?.toLocaleString() || 0}` },
        {
            field: 'profitInPercent', headerName: 'Margin %', width: 110, type: 'number',
            renderCell: (params) => (
                <Chip label={`${params.value}%`} color={params.value > 20 ? 'success' : params.value > 10 ? 'warning' : 'default'} size="small" sx={{ fontWeight: 600 }} />
            )
        },
        { field: 'profit', headerName: 'Profit', width: 120, type: 'number', valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`, cellClassName: 'font-bold text-green-600' },
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
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                        <p className="text-sm text-gray-600">Track and fulfill customer orders</p>
                    </div>
                    <button onClick={() => setOpenModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white">
                        <Plus size={16} /> Add Order
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Orders</span>
                            <ShoppingBag size={16} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
                        <p className="text-xs text-gray-400 mt-0.5">out of {allOrders.length} total</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sales Value</span>
                            <IndianRupee size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.totalValue.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">gross sales</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Profit</span>
                            <TrendingUp size={16} className="text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.totalProfit.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">net profit on orders</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</span>
                            <CheckCircle size={16} className="text-teal-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.deliveredCount}</p>
                        <p className="text-xs text-gray-400 mt-0.5">orders delivered</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-52">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search item name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X size={14} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[{ key: 'all', label: 'All Orders' }, { key: 'delivered', label: 'Delivered' }, { key: 'pending', label: 'Pending' }].map(opt => (
                            <button key={opt.key} onClick={() => setStatusFilter(opt.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === opt.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {hasActiveFilter && (
                        <button onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                            <X size={13} /> Clear
                        </button>
                    )}
                </div>

                {/* Grid */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md overflow-hidden p-2">
                    <Box sx={{ height: 500, width: '100%' }}>
                        <ProfessionalDataGrid
                            rows={orders} columns={columns} loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]} disableRowSelectionOnClick
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
                    <div className="flex justify-end gap-2 mt-1">
                        <button onClick={() => setOpenModal(false)}
                            className="px-4 py-2 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                            Cancel
                        </button>
                        <button onClick={handleSubmit}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white">
                            Add Order
                        </button>
                    </div>
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