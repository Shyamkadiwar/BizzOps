import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    Box, Typography, IconButton, Button, TextField, Grid, Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Add as AddIcon, Delete as DeleteIcon,
    AddCircle as CreditIcon, RemoveCircle as DebitIcon
} from '@mui/icons-material';
import MuiModal from "../shared/MuiModal";
import Layout from '../Layout.jsx';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import AlertDialog from '../shared/AlertDialog.jsx';

function Staff() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

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
                setStaff((response.data.data.staff || []).map(s => ({ ...s, id: s._id })));
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

    const columns = [
        { field: 'name', headerName: 'Name', width: 180, filterable: true },
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
                />
            )
        },
        {
            field: 'actions', headerName: 'Actions', width: 180, sortable: false, filterable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button size="small" variant="outlined" color="success" startIcon={<CreditIcon />}
                        onClick={() => setActionDialog({ open: true, staffId: params.row._id, action: 'credit', amount: '' })}
                        sx={{ minWidth: 0, fontSize: '0.7rem', px: 1 }}>Credit</Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<DebitIcon />}
                        onClick={() => setActionDialog({ open: true, staffId: params.row._id, action: 'debit', amount: '' })}
                        sx={{ minWidth: 0, fontSize: '0.7rem', px: 1 }}>Debit</Button>
                    <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
            )
        }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                        <p className="text-sm text-gray-600">Manage team and payroll</p>
                    </div>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAddModal(true)}>Add Staff</Button>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Staff Directory</h3>
                    <Box sx={{ height: 500, width: '100%' }}>
                        <DataGrid
                            rows={staff} columns={columns} loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]} disableRowSelectionOnClick
                            sx={{ border: 'none', '& .MuiDataGrid-cell': { borderBottom: '1px solid #f3f4f6' } }}
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                        <Button onClick={() => setOpenAddModal(false)} variant="outlined">Cancel</Button>
                        <Button onClick={handleAddStaff} variant="contained">Add Staff</Button>
                    </Box>
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
                    <Button onClick={() => setActionDialog({ ...actionDialog, open: false })}>Cancel</Button>
                    <Button onClick={handleCreditDebit} variant="contained" color={actionDialog.action === 'credit' ? 'success' : 'error'}>
                        {actionDialog.action === 'credit' ? 'Credit' : 'Debit'}
                    </Button>
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