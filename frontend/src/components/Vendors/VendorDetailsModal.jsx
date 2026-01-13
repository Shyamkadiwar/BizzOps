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
import AddVendorPayment from './AddVendorPayment';

const VendorDetailsModal = ({ open, onClose, vendorId }) => {
    const [vendor, setVendor] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [purchases, setPurchases] = useState([]);

    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (open && vendorId) {
            fetchVendorDetails();
            fetchTransactions();
            fetchPurchases();
        }
    }, [open, vendorId]);

    const fetchVendorDetails = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/details/${vendorId}`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true
                }
            );
            setVendor(response.data.data.vendor);
            setStats(response.data.data.stats);
        } catch (error) {
            console.error('Error fetching vendor details:', error);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/transactions/${vendorId}?limit=100`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true
                }
            );
            setTransactions(response.data.data.transactions.map(t => ({ ...t, id: t._id })));
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const fetchPurchases = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/purchases/${vendorId}?limit=100`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true
                }
            );
            setPurchases(response.data.data.purchases.map(p => ({ ...p, id: p._id })));
        } catch (error) {
            console.error('Error fetching purchases:', error);
        }
    };

    const handlePaymentSuccess = () => {
        setPaymentDialogOpen(false);
        fetchVendorDetails();
        fetchTransactions();
    };

    const transactionColumns = [
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueFormatter: (value) => new Date(value).toLocaleDateString()
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 100,
            renderCell: (params) => (
                <Chip label={params.value.toUpperCase()} color={params.value === 'payment' ? 'success' : 'primary'} size="small" />
            )
        },
        { field: 'description', headerName: 'Description', width: 250 },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 120,
            renderCell: (params) => (
                <Typography color={params.value < 0 ? 'success.main' : 'warning.main'}>
                    ₹{Math.abs(params.value).toLocaleString('en-IN')}
                </Typography>
            )
        },
        {
            field: 'balanceAfter',
            headerName: 'Balance',
            width: 120,
            valueFormatter: (value) => `₹${value.toLocaleString('en-IN')}`
        }
    ];

    const purchaseColumns = [
        { field: 'item', headerName: 'Item', width: 200 },
        { field: 'qty', headerName: 'Qty', width: 80 },
        {
            field: 'cost',
            headerName: 'Cost',
            width: 120,
            valueFormatter: (value) => `₹${value.toLocaleString('en-IN')}`
        },
        {
            field: 'purchaseAmount',
            headerName: 'Total',
            width: 120,
            valueFormatter: (value) => `₹${(value || 0).toLocaleString('en-IN')}`
        },
        {
            field: 'paid',
            headerName: 'Status',
            width: 100,
            renderCell: (params) => (
                <Chip label={params.value ? 'Paid' : 'Unpaid'} color={params.value ? 'success' : 'warning'} size="small" />
            )
        }
    ];

    if (!vendor) return null;

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5">{vendor.name}</Typography>
                        <IconButton onClick={onClose}><CloseIcon /></IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {vendor.email} | {vendor.phone}
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>Balance (Owed)</Typography>
                                    <Typography variant="h5" color={stats?.balance > 0 ? 'warning.main' : 'success.main'}>
                                        ₹{(stats?.balance || 0).toLocaleString('en-IN')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>Total Purchases</Typography>
                                    <Typography variant="h5">₹{(stats?.totalPurchases || 0).toLocaleString('en-IN')}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>Total Paid</Typography>
                                    <Typography variant="h5" color="success.main">
                                        ₹{(stats?.totalPaid || 0).toLocaleString('en-IN')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>Transactions</Typography>
                                    <Typography variant="h5">{stats?.transactionCount || 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

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

                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                            <Tab label="Transactions" />
                            <Tab label="Purchases" />
                        </Tabs>
                    </Box>

                    {activeTab === 0 && (
                        <Box sx={{ mt: 2 }}>
                            <DataGrid
                                rows={transactions}
                                columns={transactionColumns}
                                autoHeight
                                pageSize={10}
                                rowsPerPageOptions={[10, 25, 50]}
                                disableSelectionOnClick
                            />
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box sx={{ mt: 2 }}>
                            <DataGrid
                                rows={purchases}
                                columns={purchaseColumns}
                                autoHeight
                                pageSize={10}
                                rowsPerPageOptions={[10, 25, 50]}
                                disableSelectionOnClick
                            />
                        </Box>
                    )}
                </DialogContent>
            </Dialog >

            <AddVendorPayment
                open={paymentDialogOpen}
                onClose={() => setPaymentDialogOpen(false)}
                vendorId={vendorId}
                vendorName={vendor?.name}
                currentBalance={stats?.balance || 0}
                onSuccess={handlePaymentSuccess}
            />
        </>
    );
};

export default VendorDetailsModal;
