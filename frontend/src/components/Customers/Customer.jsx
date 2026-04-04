import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { Plus, Download, Upload, Search, X, Users, IndianRupee, AlertCircle, UserCheck } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCustomers from "./AddCustomers.jsx";
import ProfessionalDataGrid from "../shared/ProfessionalDataGrid";
import MuiModal from "../shared/MuiModal";
import Layout from "../Layout.jsx";
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import CustomerDetailsModal from './CustomerDetailsModal.jsx';

const token = localStorage.getItem('accessToken');

function Customer() {
    const [allCustomers, setAllCustomers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [balanceFilter, setBalanceFilter] = useState('all'); // 'all' | 'pending' | 'clear'
    const [cityFilter, setCityFilter] = useState('all');

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/get-customer?limit=5000`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            if (response.status === 200 && response.data?.data) {
                const data = (response.data.data.customers || []).map(c => ({ ...c, id: c._id }));
                setAllCustomers(data);
                setCustomers(data);
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    // Derive cities
    const cities = useMemo(() => {
        return [...new Set(allCustomers.map(c => c.city).filter(Boolean))].sort();
    }, [allCustomers]);

    // Apply filters instantly
    useEffect(() => {
        let filtered = [...allCustomers];

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(c =>
                c.name?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.phone?.includes(q) ||
                c.city?.toLowerCase().includes(q) ||
                c.company?.toLowerCase().includes(q) ||
                c.gstNumber?.toLowerCase().includes(q)
            );
        }

        if (balanceFilter === 'pending') filtered = filtered.filter(c => (c.balance || 0) > 0);
        else if (balanceFilter === 'clear') filtered = filtered.filter(c => (c.balance || 0) === 0);

        if (cityFilter !== 'all') filtered = filtered.filter(c => c.city === cityFilter);

        setCustomers(filtered);
    }, [search, balanceFilter, cityFilter, allCustomers]);

    // Stats
    const stats = useMemo(() => ({
        total: allCustomers.length,
        filtered: customers.length,
        totalRevenue: customers.reduce((s, c) => s + (c.totalSales || 0), 0),
        pendingBalance: customers.reduce((s, c) => s + (c.balance || 0), 0),
        withBalance: customers.filter(c => (c.balance || 0) > 0).length,
    }), [customers, allCustomers]);

    const clearFilters = () => { setSearch(''); setBalanceFilter('all'); setCityFilter('all'); };
    const hasActiveFilter = search || balanceFilter !== 'all' || cityFilter !== 'all';

    const handleCustomerAdded = () => { setOpenModal(false); fetchCustomers(); };

    const handleDelete = async (id) => {
        setConfirmDialog({
            open: true,
            title: "Delete Customer",
            message: "Are you sure you want to delete this customer?",
            onConfirm: async () => {
                try {
                    await axios.delete(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/delete-customer/${id}`,
                        { headers: { 'Authorization': token }, withCredentials: true }
                    );
                    fetchCustomers();
                } catch (error) {
                    console.error('Error deleting customer:', error);
                }
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
        });
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/export/customers`,
                { headers: { 'Authorization': token }, withCredentials: true, responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'customers.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Failed to export customers');
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/import/customers`,
                    formData,
                    { headers: { 'Authorization': token, 'Content-Type': 'multipart/form-data' }, withCredentials: true }
                );
                alert(`Import successful! ${response.data.data.success.length} customers imported.`);
                fetchCustomers();
            } catch (error) {
                alert('Failed to import customers');
            }
        };
        input.click();
    };

    const columns = [
        {
            field: 'name', headerName: 'Name', width: 160,
            renderCell: (params) => (
                <Typography
                    sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => { setSelectedCustomer(params.row._id); setCustomerDetailsOpen(true); }}
                >
                    {params.value}
                </Typography>
            )
        },
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'phone', headerName: 'Phone', width: 130 },
        { field: 'city', headerName: 'City', width: 110 },
        { field: 'company', headerName: 'Company', width: 140 },
        {
            field: 'balance', headerName: 'Balance', width: 120, type: 'number',
            renderCell: (params) => (
                <Chip
                    label={`₹${(params.value || 0).toLocaleString('en-IN')}`}
                    color={params.value > 0 ? 'error' : 'success'}
                    size="small" variant="outlined"
                />
            )
        },
        {
            field: 'totalSales', headerName: 'Total Sales', width: 130, type: 'number',
            valueFormatter: (v) => `₹${(v || 0).toLocaleString('en-IN')}`
        },
        {
            field: 'totalProfit', headerName: 'Total Profit', width: 130, type: 'number',
            renderCell: (params) => (
                <Chip
                    label={`₹${(params.value || 0).toLocaleString('en-IN')}`}
                    color={params.value > 0 ? 'success' : 'default'}
                    size="small"
                />
            )
        },
        { field: 'gstNumber', headerName: 'GST Number', width: 150 },
        { field: 'state', headerName: 'State', width: 110 },
        {
            field: 'actions', headerName: '', width: 60, sortable: false, filterable: false,
            renderCell: (params) => (
                <IconButton color="error" size="small" onClick={() => handleDelete(params.row._id)}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            )
        }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Track your customers, balances and sales history</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setOpenModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600/90 hover:to-indigo-600/90 transition-all duration-200 text-sm font-medium text-white">
                            <Plus size={16} /> Add Customer
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
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customers</span>
                            <Users size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.filtered}</p>
                        <p className="text-xs text-gray-400 mt-0.5">of {stats.total} total</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Revenue</span>
                            <IndianRupee size={16} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">from filtered customers</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Balance</span>
                            <AlertCircle size={16} className="text-red-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.pendingBalance.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stats.withBalance} customers owe</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">No Balance</span>
                            <UserCheck size={16} className="text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.filtered - stats.withBalance}</p>
                        <p className="text-xs text-gray-400 mt-0.5">fully cleared accounts</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-52">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone, city, company..."
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

                    {/* Balance Status */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'pending', label: 'Has Balance' },
                            { key: 'clear', label: 'Clear' },
                        ].map(opt => (
                            <button key={opt.key} onClick={() => setBalanceFilter(opt.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${balanceFilter === opt.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* City Dropdown */}
                    <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 font-medium">
                        <option value="all">All Cities</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {hasActiveFilter && (
                        <button onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                            <X size={13} /> Clear
                        </button>
                    )}

                    <span className="text-xs text-gray-400 ml-auto font-medium">{customers.length} customers</span>
                </div>

                {/* Table */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md overflow-hidden">
                    <Box sx={{ height: 560, width: '100%' }}>
                        <ProfessionalDataGrid
                            rows={customers}
                            columns={columns}
                            loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </div>
            </div>

            <MuiModal open={openModal} onClose={() => setOpenModal(false)} title="Add Customer">
                <AddCustomers addNewCustomer={handleCustomerAdded} onCancel={() => setOpenModal(false)} />
            </MuiModal>

            <ConfirmDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />

            <CustomerDetailsModal
                open={customerDetailsOpen}
                onClose={() => { setCustomerDetailsOpen(false); setSelectedCustomer(null); fetchCustomers(); }}
                customerId={selectedCustomer}
            />
        </Layout>
    );
}

export default Customer;