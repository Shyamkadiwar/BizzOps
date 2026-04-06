import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
    Box, Typography, IconButton, TextField, Grid, Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    Delete as DeleteIcon,
    AddCircle as CreditIcon, RemoveCircle as DebitIcon
} from '@mui/icons-material';
import { Plus, Search, X, Users, IndianRupee, AlertCircle } from 'lucide-react';
import MuiModal from "../shared/MuiModal";
import Layout from '../Layout.jsx';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import AlertDialog from '../shared/AlertDialog.jsx';
import ProfessionalDataGrid from '../shared/ProfessionalDataGrid.jsx';

function Staff() {
    const [allStaff, setAllStaff] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    // Filters
    const [search, setSearch] = useState('');
    const [balanceFilter, setBalanceFilter] = useState('all'); // 'all', 'pending', 'clear'

    // Credit/Debit dialog
    const [actionDialog, setActionDialog] = useState({ open: false, staffId: '', action: '', amount: '' });

    // Add form
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', salary: '' });

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/staff/get-staff`,
                { withCredentials: true }
            );
            if (response.data.statusCode === 200 && response.data.success) {
                const data = (response.data.data.staff || []).map(s => ({ ...s, id: s._id }));
                setAllStaff(data);
                setStaff(data);
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const handleAddStaff = async () => {
        if (!formData.name || !formData.salary) {
            setAlertDialog({ open: true, title: "Validation", message: "Name and Salary are required", severity: "warning" });
            return;
        }
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/staff/add-staff`,
                { ...formData, salary: Number(formData.salary), debitCreditHistory: Number(formData.salary) },
                { withCredentials: true }
            );
            if (response.data.statusCode === 200) {
                setAlertDialog({ open: true, title: "Success", message: "Staff added successfully", severity: "success" });
                setOpenAddModal(false);
                setFormData({ name: '', email: '', phone: '', salary: '' });
                fetchStaff();
            }
        } catch (error) {
            setAlertDialog({ open: true, title: "Error", message: error.response?.data?.message || "Error adding staff", severity: "error" });
        }
    };

    const handleCreditDebit = async () => {
        const { staffId, action, amount } = actionDialog;
        if (!amount || amount <= 0) return;
        try {
            const endpoint = action === 'credit'
                ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/staff/staff-credit`
                : `${import.meta.env.VITE_BACKEND_URL}/api/v1/staff/staff-debit`;
            await axios.post(endpoint, { staff: staffId, amount: parseInt(amount) }, { withCredentials: true });
            setActionDialog({ open: false, staffId: '', action: '', amount: '' });
            fetchStaff();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            open: true, title: "Delete Staff", message: "Are you sure you want to delete this staff member?",
            onConfirm: async () => {
                try {
                    await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/staff/delete-staff`,
                        { staff: id }, { withCredentials: true }
                    );
                    fetchStaff();
                } catch (error) { console.error('Error:', error); }
                setConfirmDialog({ ...confirmDialog, open: false });
            }
        });
    };

    // Client-side filtering
    useEffect(() => {
        let filtered = [...allStaff];

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(s => 
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.email && s.email.toLowerCase().includes(q)) ||
                (s.phone && s.phone.toLowerCase().includes(q))
            );
        }

        if (balanceFilter === 'pending') {
            filtered = filtered.filter(s => (s.debitCreditHistory || 0) > 0);
        } else if (balanceFilter === 'clear') {
            filtered = filtered.filter(s => (s.debitCreditHistory || 0) <= 0);
        }

        setStaff(filtered);
    }, [search, balanceFilter, allStaff]);

    const stats = useMemo(() => {
        const totalPayroll = allStaff.reduce((s, emp) => s + (emp.salary || 0), 0);
        const totalPending = allStaff.reduce((s, emp) => s + ((emp.debitCreditHistory > 0) ? emp.debitCreditHistory : 0), 0);
        const staffWithPending = allStaff.filter(emp => (emp.debitCreditHistory || 0) > 0).length;

        return {
            totalStaff: allStaff.length,
            filteredStaff: staff.length,
            totalPayroll,
            totalPending,
            staffWithPending
        };
    }, [staff, allStaff]);

    const columns = [
        { field: 'name', headerName: 'Name', width: 220, filterable: true, cellClassName: 'font-semibold text-gray-800' },
        { field: 'email', headerName: 'Email', width: 220 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        {
            field: 'salary', headerName: 'Salary', width: 130, type: 'number',
            valueFormatter: (value) => `₹${(value || 0).toLocaleString()}`
        },
        {
            field: 'debitCreditHistory', headerName: 'To be Paid', width: 140, type: 'number',
            renderCell: (params) => (
                <Chip
                    label={`₹${(params.value || 0).toLocaleString()}`}
                    color={params.value > 0 ? 'warning' : 'success'}
                    size="small" variant="filled"
                    sx={{ fontWeight: 'bold' }}
                />
            )
        },
        {
            field: 'actions', headerName: 'Actions', width: 220, sortable: false, filterable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <button
                        onClick={() => setActionDialog({ open: true, staffId: params.row._id, action: 'credit', amount: '' })}
                        className="flex items-center gap-1 px-2 py-1 bg-white/70 backdrop-blur-md border border-white/30 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs font-medium text-green-600">
                        <CreditIcon sx={{ fontSize: 14 }} /> Credit
                    </button>
                    <button
                        onClick={() => setActionDialog({ open: true, staffId: params.row._id, action: 'debit', amount: '' })}
                        className="flex items-center gap-1 px-2 py-1 bg-white/70 backdrop-blur-md border border-white/30 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs font-medium text-red-600">
                        <DebitIcon sx={{ fontSize: 14 }} /> Debit
                    </button>
                    <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
            )
        }
    ];

    const clearFilters = () => { setSearch(''); setBalanceFilter('all'); };
    const hasActiveFilter = search || balanceFilter !== 'all';

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                        <p className="text-sm text-gray-600">Manage team payroll and balances</p>
                    </div>
                    <button onClick={() => setOpenAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white">
                        <Plus size={16} /> Add Staff
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Staff</span>
                            <Users size={16} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.filteredStaff}</p>
                        <p className="text-xs text-gray-400 mt-0.5">out of {stats.totalStaff} total members</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly Payroll</span>
                            <IndianRupee size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.totalPayroll.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">fixed salary expenses</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Pay</span>
                            <AlertCircle size={16} className="text-red-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.totalPending.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">total unpaid balances</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members Unpaid</span>
                            <Users size={16} className="text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.staffWithPending}</p>
                        <p className="text-xs text-gray-400 mt-0.5">staff awaiting payments</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-52">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone..."
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
                        {[{ key: 'all', label: 'All Staff' }, { key: 'pending', label: 'Payment Pending' }, { key: 'clear', label: '✓ Clear' }].map(opt => (
                            <button key={opt.key} onClick={() => setBalanceFilter(opt.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${balanceFilter === opt.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
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

                {/* Staff DataGrid */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md overflow-hidden p-2">
                    <Box sx={{ height: 500, width: '100%' }}>
                        <ProfessionalDataGrid
                            rows={staff} columns={columns} loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]} disableRowSelectionOnClick
                        />
                    </Box>
                </div>
            </div>

            {/* Add Staff Modal */}
            <MuiModal open={openAddModal} onClose={() => setOpenAddModal(false)} title="Add Staff Member">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Name *" value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth required />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Email" type="email" value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })} fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Phone" value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Salary *" type="number" value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })} fullWidth required inputProps={{ min: 0 }} />
                        </Grid>
                    </Grid>
                    <div className="flex justify-end gap-2 mt-1">
                        <button onClick={() => setOpenAddModal(false)}
                            className="px-4 py-2 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                            Cancel
                        </button>
                        <button onClick={handleAddStaff}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white">
                            Add Staff
                        </button>
                    </div>
                </Box>
            </MuiModal>

            {/* Credit/Debit Dialog */}
            <Dialog open={actionDialog.open} onClose={() => setActionDialog({ ...actionDialog, open: false })} maxWidth="xs" fullWidth>
                <DialogTitle>{actionDialog.action === 'credit' ? '+ Credit' : '- Debit'} Amount</DialogTitle>
                <DialogContent>
                    <TextField label="Amount" type="number" value={actionDialog.amount} autoFocus
                        onChange={(e) => setActionDialog({ ...actionDialog, amount: e.target.value })}
                        fullWidth sx={{ mt: 1 }} inputProps={{ min: 1 }} />
                </DialogContent>
                <DialogActions>
                    <button onClick={() => setActionDialog({ ...actionDialog, open: false })}
                        className="px-4 py-2 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                        Cancel
                    </button>
                    <button onClick={handleCreditDebit}
                        className={`px-4 py-2 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white ${actionDialog.action === 'credit' ? 'bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/90 hover:to-emerald-600/90' : 'bg-gradient-to-r from-red-500/80 to-rose-500/80 hover:from-red-600/90 hover:to-rose-600/90'}`}>
                        {actionDialog.action === 'credit' ? 'Credit' : 'Debit'}
                    </button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} message={confirmDialog.message} />
            <AlertDialog open={alertDialog.open} onClose={() => setAlertDialog({ ...alertDialog, open: false })}
                title={alertDialog.title} message={alertDialog.message} severity={alertDialog.severity} />
        </Layout>
    );
}

export default Staff;