import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Box, Typography, Chip, IconButton, TextField, Grid } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Plus, Download, Upload, Search, X, IndianRupee, PieChart, CreditCard, Tag } from 'lucide-react';
import MuiModal from "../shared/MuiModal";
import Layout from '../Layout.jsx';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import AlertDialog from '../shared/AlertDialog.jsx';
import ProfessionalDataGrid from "../shared/ProfessionalDataGrid.jsx";

const token = localStorage.getItem('accessToken');

function Expenses() {
    const [allExpenses, setAllExpenses] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    // Filters
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');

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
                const mappedData = expensesData.map(expense => ({
                    ...expense,
                    id: expense._id,
                    category: expense.name || expense.category || 'N/A',
                    amount: expense.expAmount || expense.amount || 0
                }));
                // Sort by date descending
                mappedData.sort((a,b) => new Date(b.date) - new Date(a.date));
                setAllExpenses(mappedData);
                setExpenses(mappedData);
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

    // Derived lists for dropdowns
    const categories = useMemo(() => {
        return [...new Set(allExpenses.map(e => e.category).filter(Boolean))].sort();
    }, [allExpenses]);

    const months = useMemo(() => {
        return [...new Set(allExpenses.map(e => {
            if (!e.date) return null;
            const d = new Date(e.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }).filter(Boolean))].sort((a,b) => b.localeCompare(a));
    }, [allExpenses]);

    // Apply Client-side filters
    useEffect(() => {
        let filtered = [...allExpenses];

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(e => 
                (e.category && e.category.toLowerCase().includes(q)) ||
                (e.description && e.description.toLowerCase().includes(q))
            );
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(e => e.category === categoryFilter);
        }

        if (monthFilter !== 'all') {
            filtered = filtered.filter(e => {
                if (!e.date) return false;
                const d = new Date(e.date);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthFilter;
            });
        }

        setExpenses(filtered);
    }, [search, categoryFilter, monthFilter, allExpenses]);

    const stats = useMemo(() => {
        const totalGross = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        
        // Find highest category
        const catSums = {};
        expenses.forEach(e => {
            if (e.category) catSums[e.category] = (catSums[e.category] || 0) + (e.amount || 0);
        });
        let highestCat = 'N/A';
        let highestSum = 0;
        Object.entries(catSums).forEach(([cat, sum]) => {
            if (sum > highestSum) { highestSum = sum; highestCat = cat; }
        });

        // This Month
        const now = new Date();
        const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const thisMonthTotal = allExpenses
            .filter(e => e.date && `${new Date(e.date).getFullYear()}-${String(new Date(e.date).getMonth() + 1).padStart(2, '0')}` === thisMonthStr)
            .reduce((s, e) => s + (e.amount || 0), 0);

        return {
            totalItems: allExpenses.length,
            filteredItems: expenses.length,
            totalGross,
            highestCat,
            highestSum,
            thisMonthTotal
        };
    }, [expenses, allExpenses]);

    const formatMonth = (m) => {
        const [year, month] = m.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const clearFilters = () => { setSearch(''); setCategoryFilter('all'); setMonthFilter('all'); };
    const hasActiveFilter = search || categoryFilter !== 'all' || monthFilter !== 'all';

    const columns = [
        { field: 'date', headerName: 'Date', width: 130, valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
        { field: 'category', headerName: 'Item / Category', width: 220, filterable: true,
          renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" />
        },
        { field: 'description', headerName: 'Description', width: 350, filterable: true },
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
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
                        <p className="text-sm text-gray-600">Track and manage business expenses digitally</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setOpenModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white">
                            <Plus size={16} /> Add Expense
                        </button>
                        <button onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                            <Download size={16} /> Export
                        </button>
                        <button onClick={handleImport}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                            <Upload size={16} /> Import
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gross Expenses</span>
                            <IndianRupee size={16} className="text-red-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.totalGross.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">from filtered results</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expense Count</span>
                            <CreditCard size={16} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.filteredItems}</p>
                        <p className="text-xs text-gray-400 mt-0.5">out of {stats.totalItems} total tracking</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Highest Category</span>
                            <PieChart size={16} className="text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 truncate">{stats.highestCat}</p>
                        <p className="text-xs text-gray-400 mt-0.5">₹{stats.highestSum.toLocaleString('en-IN')} spent</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">This Month Total</span>
                            <Tag size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.thisMonthTotal.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">overall spending this month</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-52">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search category, description..."
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

                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 font-medium">
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 font-medium">
                        <option value="all">All Time</option>
                        {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
                    </select>

                    {hasActiveFilter && (
                        <button onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                            <X size={13} /> Clear
                        </button>
                    )}
                </div>

                {/* DataGrid */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md overflow-hidden p-2">
                    <Box sx={{ height: 500, width: '100%' }}>
                        <ProfessionalDataGrid
                            rows={expenses} columns={columns} loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]} disableRowSelectionOnClick
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
                    <div className="flex justify-end gap-2 mt-1">
                        <button onClick={() => setOpenModal(false)}
                            className="px-4 py-2 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                            Cancel
                        </button>
                        <button onClick={handleSubmit}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white">
                            Add Expense
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

export default Expenses;