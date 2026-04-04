import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { Plus, Search, X, Store, IndianRupee, AlertCircle, CheckCircle2 } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/Delete';
import ProfessionalDataGrid from "../shared/ProfessionalDataGrid.jsx";
import MuiModal from "../shared/MuiModal.jsx";
import Layout from "../Layout.jsx";
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import VendorDetailsModal from './VendorDetailsModal.jsx';
import AddVendor from './AddVendor.jsx';

const token = localStorage.getItem('accessToken');

const Vendor = () => {
    const [allVendors, setAllVendors] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [vendorDetailsOpen, setVendorDetailsOpen] = useState(false);

    // Filter states
    const [search, setSearch] = useState('');
    const [balanceFilter, setBalanceFilter] = useState('all'); // 'all' | 'pending' | 'clear'
    const [cityFilter, setCityFilter] = useState('all');

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/list?limit=5000`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            const vendorData = (response.data.data.vendors || []).map(v => ({ ...v, id: v._id }));
            setAllVendors(vendorData);
            setVendors(vendorData);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchVendors(); }, [fetchVendors]);

    // Derive cities
    const cities = useMemo(() => {
        return [...new Set(allVendors.map(v => v.city).filter(Boolean))].sort();
    }, [allVendors]);

    // Apply filters
    useEffect(() => {
        let filtered = [...allVendors];

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(v =>
                v.name?.toLowerCase().includes(q) ||
                v.email?.toLowerCase().includes(q) ||
                v.phone?.includes(q) ||
                v.city?.toLowerCase().includes(q) ||
                v.gstNumber?.toLowerCase().includes(q)
            );
        }

        if (balanceFilter === 'pending') filtered = filtered.filter(v => (v.balance || 0) > 0);
        else if (balanceFilter === 'clear') filtered = filtered.filter(v => (v.balance || 0) === 0);

        if (cityFilter !== 'all') filtered = filtered.filter(v => v.city === cityFilter);

        setVendors(filtered);
    }, [search, balanceFilter, cityFilter, allVendors]);

    // Stats
    const stats = useMemo(() => ({
        total: allVendors.length,
        filtered: vendors.length,
        pendingBalance: vendors.reduce((sum, v) => sum + (v.balance || 0), 0),
        totalPurchases: vendors.reduce((sum, v) => sum + (v.totalPurchases || 0), 0),
        withBalance: vendors.filter(v => (v.balance || 0) > 0).length,
    }), [vendors, allVendors]);

    const clearFilters = () => { setSearch(''); setBalanceFilter('all'); setCityFilter('all'); };
    const hasActiveFilter = search || balanceFilter !== 'all' || cityFilter !== 'all';

    const handleVendorAdded = () => { setOpenModal(false); fetchVendors(); };

    const handleDelete = async (id) => {
        setConfirmDialog({
            open: true,
            title: "Delete Vendor",
            message: "Are you sure you want to delete this vendor?",
            onConfirm: async () => {
                try {
                    await axios.delete(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/delete/${id}`,
                        { headers: { 'Authorization': token }, withCredentials: true }
                    );
                    fetchVendors();
                } catch (error) {
                    console.error('Error deleting vendor:', error);
                }
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
        });
    };

    const columns = [
        {
            field: 'name', headerName: 'Name', width: 180,
            renderCell: (params) => (
                <Typography
                    sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => { setSelectedVendor(params.row._id); setVendorDetailsOpen(true); }}
                >
                    {params.value}
                </Typography>
            )
        },
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'phone', headerName: 'Phone', width: 130 },
        { field: 'city', headerName: 'City', width: 120 },
        {
            field: 'balance', headerName: 'Balance (Owed)', width: 150, type: 'number',
            renderCell: (params) => (
                <Chip
                    label={`₹${(params.value || 0).toLocaleString('en-IN')}`}
                    color={params.value > 0 ? 'warning' : 'success'}
                    size="small" variant="outlined"
                />
            )
        },
        {
            field: 'totalPurchases', headerName: 'Total Purchases', width: 150, type: 'number',
            valueFormatter: (v) => `₹${(v || 0).toLocaleString('en-IN')}`
        },
        {
            field: 'totalPaid', headerName: 'Total Paid', width: 130, type: 'number',
            valueFormatter: (v) => `₹${(v || 0).toLocaleString('en-IN')}`
        },
        { field: 'gstNumber', headerName: 'GST Number', width: 150 },
        { field: 'state', headerName: 'State', width: 120 },
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
                        <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage suppliers, track purchases and outstanding balances</p>
                    </div>
                    <button onClick={() => setOpenModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600/90 hover:to-indigo-600/90 transition-all duration-200 text-sm font-medium text-white">
                        <Plus size={16} /> Add Vendor
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Vendors</span>
                            <Store size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.filtered}</p>
                        <p className="text-xs text-gray-400 mt-0.5">of {stats.total} total</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Purchases</span>
                            <IndianRupee size={16} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.totalPurchases.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">from filtered vendors</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Balance</span>
                            <AlertCircle size={16} className="text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.pendingBalance.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stats.withBalance} vendors owe</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cleared</span>
                            <CheckCircle2 size={16} className="text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.filtered - stats.withBalance}</p>
                        <p className="text-xs text-gray-400 mt-0.5">fully paid vendors</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-48">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone, city, GST..."
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

                    {/* Balance filter */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'pending', label: 'Pending' },
                            { key: 'clear', label: 'Clear' },
                        ].map(opt => (
                            <button key={opt.key} onClick={() => setBalanceFilter(opt.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${balanceFilter === opt.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* City dropdown */}
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

                    <span className="text-xs text-gray-400 ml-auto font-medium">{vendors.length} vendors</span>
                </div>

                {/* Table */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md overflow-hidden">
                    <Box sx={{ height: 560, width: '100%' }}>
                        <ProfessionalDataGrid
                            rows={vendors}
                            columns={columns}
                            loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </div>
            </div>

            <MuiModal open={openModal} onClose={() => setOpenModal(false)} title="Add Vendor">
                <AddVendor onSuccess={handleVendorAdded} onCancel={() => setOpenModal(false)} />
            </MuiModal>

            <ConfirmDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />

            <VendorDetailsModal
                open={vendorDetailsOpen}
                onClose={() => { setVendorDetailsOpen(false); setSelectedVendor(null); fetchVendors(); }}
                vendorId={selectedVendor}
            />
        </Layout>
    );
};

export default Vendor;
