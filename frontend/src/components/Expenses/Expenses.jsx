import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    Box, Typography, Chip, IconButton, Button, TextField, Grid
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Add as AddIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import MuiModal from "../shared/MuiModal";
import Layout from '../Layout.jsx';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import AlertDialog from '../shared/AlertDialog.jsx';

const token = localStorage.getItem('accessToken');

function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    // Form state
    const [formData, setFormData] = useState({
        name: '', expAmount: '', description: '', date: new Date().toISOString().split('T')[0]
    });

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/get-expense`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            if (response.status === 200 && response.data?.data) {
                const expensesData = response.data.data.expenses || response.data.data.expense || [];
                setExpenses(expensesData.map(expense => ({
                    ...expense,
                    id: expense._id,
                    category: expense.name || expense.category || 'N/A',
                    amount: expense.expAmount || expense.amount || 0
                })));
            }
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.expAmount || !formData.date) {
            setAlertDialog({ open: true, title: "Validation", message: "Please fill all required fields", severity: "warning" });
            return;
        }
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/add-expense`,
                { ...formData, expAmount: parseFloat(formData.expAmount) },
                { withCredentials: true }
            );
            if (response.data.statusCode === 200) {
                setAlertDialog({ open: true, title: "Success", message: "Expense added successfully", severity: "success" });
                setOpenModal(false);
                setFormData({ name: '', expAmount: '', description: '', date: new Date().toISOString().split('T')[0] });
                fetchExpenses();
            }
        } catch (error) {
            setAlertDialog({ open: true, title: "Error", message: error.response?.data?.message || "Error adding expense", severity: "error" });
        }
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            open: true, title: "Delete Expense", message: "Are you sure you want to delete this expense?",
            onConfirm: async () => {
                try {
                    await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/delete-expense`,
                        { id }, { headers: { 'Authorization': token }, withCredentials: true }
                    );
                    fetchExpenses();
                } catch (error) { console.error('Error deleting expense:', error); }
                setConfirmDialog({ ...confirmDialog, open: false });
            }
        });
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/export/expenses`,
                { headers: { 'Authorization': token }, withCredentials: true, responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'expenses.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) { alert('Failed to export expenses'); }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.xlsx,.xls';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('file', file);
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/import/expenses`, fd,
                    { headers: { 'Authorization': token, 'Content-Type': 'multipart/form-data' }, withCredentials: true }
                );
                setAlertDialog({ open: true, title: "Import Successful", message: `${response.data.data.success.length} expenses imported.`, severity: "success" });
                fetchExpenses();
            } catch (error) { setAlertDialog({ open: true, title: "Error", message: "Failed to import expenses", severity: "error" }); }
        };
        input.click();
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const columns = [
        { field: 'date', headerName: 'Date', width: 130, valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
        { field: 'category', headerName: 'Item / Category', width: 200, filterable: true },
        { field: 'description', headerName: 'Description', width: 300, filterable: true },
        {
            field: 'amount', headerName: 'Amount', width: 150, type: 'number',
            renderCell: (params) => (
                <Typography fontWeight={600} color="error.main">₹{params.value?.toLocaleString() || 0}</Typography>
            )
        },
        {
            field: 'actions', headerName: 'Actions', width: 100, sortable: false, filterable: false,
            renderCell: (params) => (
                <IconButton color="error" size="small" onClick={() => handleDelete(params.row._id)}><DeleteIcon /></IconButton>
            )
        }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
                        <p className="text-sm text-gray-600">Total Expenses: <strong>₹{totalExpenses.toLocaleString()}</strong></p>
                    </div>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}>Add Expense</Button>
                        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} color="warning">Export</Button>
                        <Button variant="outlined" startIcon={<UploadIcon />} onClick={handleImport} color="info">Import</Button>
                    </Box>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Records</h3>
                    <Box sx={{ height: 500, width: '100%' }}>
                        <DataGrid
                            rows={expenses} columns={columns} loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]} disableRowSelectionOnClick
                            sx={{ border: 'none', '& .MuiDataGrid-cell': { borderBottom: '1px solid #f3f4f6' } }}
                        />
                    </Box>
                </div>
            </div>

            <MuiModal open={openModal} onClose={() => setOpenModal(false)} title="Add Expense">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Item / Category *" value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth required />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Amount *" type="number" value={formData.expAmount}
                                onChange={(e) => setFormData({ ...formData, expAmount: e.target.value })} fullWidth required inputProps={{ min: 0, step: 0.01 }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Description" value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={2} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Date *" type="date" value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} required />
                        </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                        <Button onClick={() => setOpenModal(false)} variant="outlined">Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained">Add Expense</Button>
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

export default Expenses;