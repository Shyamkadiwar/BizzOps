import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Tabs,
    Tab,
    IconButton,
    Chip,
    TextField,
    MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaymentIcon from '@mui/icons-material/Payment';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import AddCustomerPayment from './AddCustomerPayment';

const CustomerDetailsModal = ({ open, onClose, customerId }) => {
    const [customer, setCustomer] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

    // Transactions state
    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionFilters, setTransactionFilters] = useState({
        type: '',
        startDate: '',
        endDate: ''
    });

    // Sales state
    const [sales, setSales] = useState([]);
    const [salesLoading, setSalesLoading] = useState(false);
    const [salesFilters, setSalesFilters] = useState({
        paid: '',
        startDate: '',
        endDate: ''
    });

    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (open && customerId) {
            fetchCustomerDetails();
            fetchTransactions();
            fetchSales();
        }
    }, [open, customerId]);

    const fetchCustomerDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/details/${customerId}`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true
                }
            );
            setCustomer(response.data.data.customer);
            setStats(response.data.data.stats);
        } catch (error) {
            console.error('Error fetching customer details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setTransactionsLoading(true);
        try {
            const params = new URLSearchParams({
                limit: 100,
                ...transactionFilters
            });
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/transactions/${customerId}?${params}`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true
                }
            );
            setTransactions(response.data.data.transactions.map(t => ({ ...t, id: t._id })));
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setTransactionsLoading(false);
        }
    };

    const fetchSales = async () => {
        setSalesLoading(true);
        try {
            const params = new URLSearchParams({
                limit: 100,
                ...salesFilters
            });
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/sales/${customerId}?${params}`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true
                }
            );
            setSales(response.data.data.sales.map(s => ({ ...s, id: s._id })));
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setSalesLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setPaymentDialogOpen(false);
        fetchCustomerDetails();
        fetchTransactions();
        fetchSales();
    };

    const transactionColumns = [
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value.toUpperCase()}
                    color={params.value === 'payment' ? 'success' : 'primary'}
                    size="small"
                />
            )
        },
        {
            field: 'description',
            headerName: 'Description',
            width: 250
        },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 120,
            renderCell: (params) => (
                <Typography color={params.value < 0 ? 'success.main' : 'error.main'}>
                    ₹{Math.abs(params.value).toLocaleString('en-IN')}
                </Typography>
            )
        },
        {
            field: 'balanceAfter',
            headerName: 'Balance',
            width: 120,
            valueFormatter: (value) => value != null ? `₹${value.toLocaleString('en-IN')}` : '₹0'
        }
    ];

    const salesColumns = [
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
        },
        {
            field: 'productName',
            headerName: 'Product',
            width: 200
        },
        {
            field: 'qty',
            headerName: 'Qty',
            width: 80
        },
        {
            field: 'sale',
            headerName: 'Amount',
            width: 120,
            valueFormatter: (value) => value != null ? `₹${value.toLocaleString('en-IN')}` : '₹0'
        },
        {
            field: 'profit',
            headerName: 'Profit',
            width: 120,
            valueFormatter: (value) => value != null ? `₹${value.toLocaleString('en-IN')}` : '₹0'
        }
    ];

    if (!customer) return null;

    return (
        <>
            <Dialog 
                open={open} 
                onClose={onClose} 
                maxWidth="lg" 
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.15)',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    background: 'linear-gradient(90deg, rgba(248,250,252,0.9) 0%, rgba(255,255,255,0.95) 100%)',
                    pt: 3, pb: 2, px: 4
                }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                                {customer.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontWeight: 500 }}>
                                {customer.email} • {customer.phone}
                            </Typography>
                        </Box>
                        <IconButton 
                            onClick={onClose}
                            sx={{ 
                                background: '#f1f5f9', 
                                color: '#64748b',
                                '&:hover': { background: '#e2e8f0', color: '#0f172a', transform: 'rotate(90deg)' },
                                transition: 'all 0.2s',
                                width: 40, height: 40
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 4, background: '#f8fafc' }}>
                    {/* Stats Cards */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 3, mb: 4 }}>
                        <Card sx={{
                            borderRadius: '20px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(226, 232, 240, 0.8)',
                            transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.06)' },
                            display: 'flex', flexDirection: 'column', height: '100%'
                        }}>
                            <CardContent sx={{ p: 3, flexGrow: 1 }}>
                                <Typography sx={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                                    Current Balance
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: stats?.balance > 0 ? '#ef4444' : '#10b981' }}>
                                    ₹{(stats?.balance || 0).toLocaleString('en-IN')}
                                </Typography>
                            </CardContent>
                        </Card>
                        
                        <Card sx={{
                            borderRadius: '20px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(226, 232, 240, 0.8)',
                            transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.06)' },
                            display: 'flex', flexDirection: 'column', height: '100%'
                        }}>
                            <CardContent sx={{ p: 3, flexGrow: 1 }}>
                                <Typography sx={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                                    Total Sales
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                    ₹{(stats?.totalSales || 0).toLocaleString('en-IN')}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card sx={{
                            borderRadius: '20px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(226, 232, 240, 0.8)',
                            transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.06)' },
                            display: 'flex', flexDirection: 'column', height: '100%'
                        }}>
                            <CardContent sx={{ p: 3, flexGrow: 1 }}>
                                <Typography sx={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                                    Total Profit
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                                    ₹{(stats?.totalProfit || 0).toLocaleString('en-IN')}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card sx={{
                            borderRadius: '20px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(226, 232, 240, 0.8)',
                            transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.06)' },
                            display: 'flex', flexDirection: 'column', height: '100%'
                        }}>
                            <CardContent sx={{ p: 3, flexGrow: 1 }}>
                                <Typography sx={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                                    Transactions
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                    {stats?.transactionCount || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-start' }}>
                        <Button
                            variant="contained"
                            startIcon={<PaymentIcon />}
                            onClick={() => setPaymentDialogOpen(true)}
                            disabled={stats?.balance <= 0}
                            sx={{
                                borderRadius: '12px',
                                background: stats?.balance <= 0 ? 'rgba(0,0,0,0.1)' : '#4f46e5',
                                color: '#fff',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '15px',
                                padding: '10px 24px',
                                boxShadow: stats?.balance <= 0 ? 'none' : '0 10px 20px -10px rgba(15,23,42,0.5)',
                                '&:hover': {
                                    background: '#4338ca',
                                    boxShadow: '0 10px 25px -10px rgba(0,0,0,0.6)',
                                }
                            }}
                        >
                            Add Payment
                        </Button>
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'rgba(0,0,0,0.08)', mb: 3 }}>
                        <Tabs 
                            value={activeTab} 
                            onChange={(e, newValue) => setActiveTab(newValue)}
                            sx={{
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '15px',
                                    color: '#64748b',
                                },
                                '& .Mui-selected': {
                                    color: '#0f172a !important',
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#0f172a',
                                    height: '3px',
                                    borderTopLeftRadius: '3px',
                                    borderTopRightRadius: '3px',
                                }
                            }}
                        >
                            <Tab label="Transactions" disableRipple />
                            <Tab label="Sales" disableRipple />
                        </Tabs>
                    </Box>

                    {/* Transactions Tab */}
                    {activeTab === 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    select
                                    label="Type"
                                    value={transactionFilters.type}
                                    onChange={(e) => setTransactionFilters({ ...transactionFilters, type: e.target.value })}
                                    size="small"
                                    sx={{ minWidth: 120 }}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="sale">Sale</MenuItem>
                                    <MenuItem value="payment">Payment</MenuItem>
                                </TextField>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    value={transactionFilters.startDate}
                                    onChange={(e) => setTransactionFilters({ ...transactionFilters, startDate: e.target.value })}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="End Date"
                                    type="date"
                                    value={transactionFilters.endDate}
                                    onChange={(e) => setTransactionFilters({ ...transactionFilters, endDate: e.target.value })}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <Button onClick={fetchTransactions} variant="contained" sx={{ 
                                    background: '#0f172a', color: '#fff', borderRadius: '8px',
                                    textTransform: 'none', fontWeight: 600, boxShadow: 'none', px: 3,
                                    '&:hover': { background: '#1e293b' }
                                }}>
                                    Apply
                                </Button>
                            </Box>
                            <Box sx={{ 
                                background: '#fff', 
                                borderRadius: '16px', 
                                border: '1px solid rgba(0,0,0,0.05)',
                                overflow: 'hidden',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                            }}>
                                <DataGrid
                                    rows={transactions}
                                    columns={transactionColumns}
                                    loading={transactionsLoading}
                                    autoHeight
                                    pageSize={10}
                                    rowsPerPageOptions={[10, 25, 50]}
                                    disableSelectionOnClick
                                    sx={{
                                        border: 'none',
                                        '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '14px' },
                                        '& .MuiDataGrid-columnHeaders': { 
                                            background: '#f8fafc',
                                            borderBottom: '1px solid #e2e8f0', 
                                            color: '#64748b', 
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            fontSize: '12px',
                                            letterSpacing: '0.5px'
                                        },
                                        '& .MuiDataGrid-row:hover': { background: '#f8fafc' }
                                    }}
                                />
                            </Box>
                        </Box>
                    )}

                    {/* Sales Tab */}
                    {activeTab === 1 && (
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    select
                                    label="Status"
                                    value={salesFilters.paid}
                                    onChange={(e) => setSalesFilters({ ...salesFilters, paid: e.target.value })}
                                    size="small"
                                    sx={{ minWidth: 120 }}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="true">Paid</MenuItem>
                                    <MenuItem value="false">Unpaid</MenuItem>
                                </TextField>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    value={salesFilters.startDate}
                                    onChange={(e) => setSalesFilters({ ...salesFilters, startDate: e.target.value })}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="End Date"
                                    type="date"
                                    value={salesFilters.endDate}
                                    onChange={(e) => setSalesFilters({ ...salesFilters, endDate: e.target.value })}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <Button onClick={fetchSales} variant="contained" sx={{ 
                                    background: '#0f172a', color: '#fff', borderRadius: '8px',
                                    textTransform: 'none', fontWeight: 600, boxShadow: 'none', px: 3,
                                    '&:hover': { background: '#1e293b' }
                                }}>
                                    Apply
                                </Button>
                            </Box>
                            <Box sx={{ 
                                background: '#fff', 
                                borderRadius: '16px', 
                                border: '1px solid rgba(0,0,0,0.05)',
                                overflow: 'hidden',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                            }}>
                                <DataGrid
                                    rows={sales}
                                    columns={salesColumns}
                                    loading={salesLoading}
                                    autoHeight
                                    pageSize={10}
                                    rowsPerPageOptions={[10, 25, 50]}
                                    disableSelectionOnClick
                                    sx={{
                                        border: 'none',
                                        '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '14px' },
                                        '& .MuiDataGrid-columnHeaders': { 
                                            background: '#f8fafc',
                                            borderBottom: '1px solid #e2e8f0', 
                                            color: '#64748b', 
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            fontSize: '12px',
                                            letterSpacing: '0.5px'
                                        },
                                        '& .MuiDataGrid-row:hover': { background: '#f8fafc' }
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <AddCustomerPayment
                open={paymentDialogOpen}
                onClose={() => setPaymentDialogOpen(false)}
                customerId={customerId}
                customerName={customer?.name}
                currentBalance={stats?.balance || 0}
                onSuccess={handlePaymentSuccess}
            />
        </>
    );
};

export default CustomerDetailsModal;
