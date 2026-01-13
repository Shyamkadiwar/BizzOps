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
        },
        {
            field: 'paid',
            headerName: 'Status',
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Paid' : 'Unpaid'}
                    color={params.value ? 'success' : 'warning'}
                    size="small"
                />
            )
        }
    ];

    if (!customer) return null;

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5">{customer.name}</Typography>
                        <IconButton onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {customer.email} | {customer.phone}
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    {/* Stats Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Current Balance
                                    </Typography>
                                    <Typography variant="h5" color={stats?.balance > 0 ? 'error.main' : 'success.main'}>
                                        ₹{(stats?.balance || 0).toLocaleString('en-IN')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Total Sales
                                    </Typography>
                                    <Typography variant="h5">
                                        ₹{(stats?.totalSales || 0).toLocaleString('en-IN')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Total Profit
                                    </Typography>
                                    <Typography variant="h5" color="success.main">
                                        ₹{(stats?.totalProfit || 0).toLocaleString('en-IN')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Transactions
                                    </Typography>
                                    <Typography variant="h5">
                                        {stats?.transactionCount || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Action Buttons */}
                    <Box sx={{ mb: 3 }}>
                        <Button
                            variant="contained"
                            startIcon={<PaymentIcon />}
                            onClick={() => setPaymentDialogOpen(true)}
                            disabled={stats?.balance <= 0}
                        >
                            Add Payment
                        </Button>
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                            <Tab label="Transactions" />
                            <Tab label="Sales" />
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
                                <Button onClick={fetchTransactions} variant="outlined">
                                    Apply Filters
                                </Button>
                            </Box>
                            <DataGrid
                                rows={transactions}
                                columns={transactionColumns}
                                loading={transactionsLoading}
                                autoHeight
                                pageSize={10}
                                rowsPerPageOptions={[10, 25, 50]}
                                disableSelectionOnClick
                            />
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
                                <Button onClick={fetchSales} variant="outlined">
                                    Apply Filters
                                </Button>
                            </Box>
                            <DataGrid
                                rows={sales}
                                columns={salesColumns}
                                loading={salesLoading}
                                autoHeight
                                pageSize={10}
                                rowsPerPageOptions={[10, 25, 50]}
                                disableSelectionOnClick
                            />
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
