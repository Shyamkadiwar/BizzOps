import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, Typography, Chip, IconButton } from '@mui/material';
import { Plus, Download, Calendar, TrendingUp, IndianRupee, Package, Filter, ExternalLink } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/Delete';
import AddMultiItemSale from "./AddMultiItemSale.jsx";
import MuiModal from "../shared/MuiModal";
import Layout from "../Layout.jsx";
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import CustomerDetailsModal from '../Customers/CustomerDetailsModal.jsx';
import ProfessionalDataGrid from "../shared/ProfessionalDataGrid.jsx";

const token = localStorage.getItem('accessToken');

// Helper: format a Date to YYYY-MM-DD for input[type=date]
const toInputDate = (d) => d.toISOString().split('T')[0];

// Helper: today and start of today
const getTodayStr = () => toInputDate(new Date());

function Sales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);

    // Date filter state — default to today
    const [fromDate, setFromDate] = useState(getTodayStr());
    const [toDate, setToDate] = useState(getTodayStr());

    // Summary stats
    const [totalSaleValue, setTotalSaleValue] = useState(0);
    const [totalProfitValue, setTotalProfitValue] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const fetchSales = useCallback(async (from, to) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-sale-range`,
                {
                    params: { fromDate: from, toDate: to },
                    headers: { 'Authorization': token },
                    withCredentials: true
                }
            );

            if (response.status === 200 && response.data?.data) {
                const { sales: salesData, totalSaleValue: tsv, totalProfitValue: tpv, totalCount: tc } = response.data.data;
                setSales((salesData || []).map(sale => ({ ...sale, id: sale._id })));
                setTotalSaleValue(tsv || 0);
                setTotalProfitValue(tpv || 0);
                setTotalCount(tc || 0);
            }
        } catch (error) {
            console.error('Failed to fetch sales:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load today's sales on mount
    useEffect(() => {
        fetchSales(fromDate, toDate);
    }, []); // eslint-disable-line

    const handleApplyFilter = () => {
        if (!fromDate || !toDate) return;
        fetchSales(fromDate, toDate);
    };

    // Quick range presets
    const applyPreset = (days) => {
        const to = new Date();
        const from = new Date();
        if (days === 0) {
            // Today only
            setFromDate(getTodayStr());
            setToDate(getTodayStr());
            fetchSales(getTodayStr(), getTodayStr());
        } else {
            from.setDate(from.getDate() - (days - 1));
            const f = toInputDate(from);
            const t = toInputDate(to);
            setFromDate(f);
            setToDate(t);
            fetchSales(f, t);
        }
    };

    const handleSaleAdded = () => {
        setOpenModal(false);
        fetchSales(fromDate, toDate);
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/export/sales`,
                { headers: { 'Authorization': token }, withCredentials: true, responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'sales.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export sales');
        }
    };

    const handleDelete = async (id) => {
        setConfirmDialog({
            open: true,
            title: "Delete Sale",
            message: "Are you sure you want to delete this sale? This will also delete the associated invoice.",
            onConfirm: async () => {
                try {
                    await axios.delete(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/delete-sale/${id}`,
                        { headers: { 'Authorization': token }, withCredentials: true }
                    );
                    fetchSales(fromDate, toDate);
                } catch (error) {
                    console.error('Delete failed:', error);
                    alert('Failed to delete sale');
                }
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
        });
    };

    const columns = [
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueFormatter: (value) => new Date(value).toLocaleDateString('en-IN')
        },
        { field: 'productName', headerName: 'Product', width: 180, filterable: true },
        {
            field: 'customerName',
            headerName: 'Customer',
            width: 150,
            filterable: true,
            renderCell: (params) => params.row.customer ? (
                <Box
                    onClick={() => {
                        const customerId = typeof params.row.customer === 'object'
                            ? params.row.customer._id
                            : params.row.customer;
                        setSelectedCustomer(customerId);
                        setCustomerDetailsOpen(true);
                    }}
                    sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'pointer',
                        color: '#4f46e5', fontWeight: 600,
                        transition: 'all 0.2s',
                        '&:hover': { textDecoration: 'underline', color: '#4338ca' }
                    }}
                >
                    {params.value || 'Walk-in'}
                    <ExternalLink size={14} style={{ opacity: 0.7 }} />
                </Box>
            ) : (params.value || 'Walk-in')
        },
        {
            field: 'qty',
            headerName: 'Qty',
            width: 80,
            type: 'number',
            renderCell: (params) => <Chip label={params.value} color="primary" size="small" />
        },
        {
            field: 'cost',
            headerName: 'Cost',
            width: 100,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString('en-IN') || 0}`
        },
        {
            field: 'price',
            headerName: 'Price',
            width: 100,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString('en-IN') || 0}`
        },
        {
            field: 'profitPercent',
            headerName: 'Profit %',
            width: 100,
            type: 'number',
            renderCell: (params) => (
                <Chip
                    label={`${params.value?.toFixed(1)}%`}
                    color={params.value > 20 ? 'success' : params.value > 10 ? 'warning' : 'default'}
                    size="small"
                />
            )
        },
        {
            field: 'profit',
            headerName: 'Profit',
            width: 110,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString('en-IN') || 0}`,
        },
        {
            field: 'sale',
            headerName: 'Total Sale',
            width: 120,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString('en-IN') || 0}`,
        },
        {
            field: 'invoice',
            headerName: 'Invoice',
            width: 90,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Done' : 'Pending'}
                    color={params.value ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            field: 'actions',
            headerName: '',
            width: 60,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <IconButton color="error" size="small" onClick={() => handleDelete(params.row._id)}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            )
        }
    ];

    // Date range label for display
    const rangeLabel = fromDate === toDate
        ? new Date(fromDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : `${new Date(fromDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — ${new Date(toDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Track and manage all your sales transactions</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setOpenModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white"
                        >
                            <Plus size={16} /> Add Sale
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700"
                        >
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>

                {/* ── Filter Bar + Summary Cards ── */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6 items-start lg:items-stretch">

                    {/* Filter Panel */}
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md p-4 flex flex-col gap-3 flex-shrink-0">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <Filter size={13} />
                            Date Range Filter
                        </div>

                        {/* Quick presets */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: 'Today', days: 0 },
                                { label: 'Last 7 days', days: 7 },
                                { label: 'Last 30 days', days: 30 },
                                { label: 'Last 90 days', days: 90 },
                            ].map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => applyPreset(preset.days)}
                                    className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-600 transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom date inputs */}
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500">From</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    max={toDate}
                                    onChange={e => setFromDate(e.target.value)}
                                    className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 font-medium"
                                />
                            </div>
                            <span className="text-gray-400 mt-5 text-sm">—</span>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500">To</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    min={fromDate}
                                    max={getTodayStr()}
                                    onChange={e => setToDate(e.target.value)}
                                    className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 font-medium"
                                />
                            </div>
                            <button
                                onClick={handleApplyFilter}
                                className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                            >
                                Apply
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                        {/* Total Sale */}
                        <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Sales</p>
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <IndianRupee size={18} className="text-blue-600" />
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    ₹{totalSaleValue.toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{rangeLabel}</p>
                            </div>
                        </div>

                        {/* Total Profit */}
                        <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Profit</p>
                                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                                    <TrendingUp size={18} className="text-green-600" />
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700">
                                    ₹{totalProfitValue.toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {totalSaleValue > 0 ? `${((totalProfitValue / totalSaleValue) * 100).toFixed(1)}% margin` : 'No sales yet'}
                                </p>
                            </div>
                        </div>

                        {/* Total Transactions */}
                        <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transactions</p>
                                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                                    <Package size={18} className="text-purple-600" />
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalCount}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {totalCount > 0 ? `Avg ₹${Math.round(totalSaleValue / totalCount).toLocaleString('en-IN')} / sale` : 'No sales yet'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-sm font-semibold text-gray-700">
                                Sales for: <span className="text-indigo-600">{rangeLabel}</span>
                            </span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{totalCount} records</span>
                    </div>
                    <Box sx={{ height: 560, width: '100%' }}>
                        <ProfessionalDataGrid
                            rows={sales}
                            columns={columns}
                            loading={loading}
                            initialState={{
                                pagination: {
                                    paginationModel: { pageSize: 25, page: 0 },
                                },
                            }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </div>
            </div>

            <MuiModal open={openModal} onClose={() => setOpenModal(false)} title="Add Sale">
                <AddMultiItemSale addNewSale={handleSaleAdded} onCancel={() => setOpenModal(false)} />
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
                onClose={() => { setCustomerDetailsOpen(false); setSelectedCustomer(null); }}
                customerId={selectedCustomer}
            />
        </Layout>
    );
}

export default Sales;