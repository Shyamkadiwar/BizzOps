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
    Tooltip,
    Divider,
    Switch,
    FormControlLabel,
    alpha
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaymentIcon from '@mui/icons-material/Payment';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import AddVendorPayment from './AddVendorPayment';
import AlertDialog from '../shared/AlertDialog';
import ConfirmDialog from '../shared/ConfirmDialog';

const VendorDetailsModal = ({ open, onClose, vendorId }) => {
    const [vendor, setVendor] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);

    // Edit vendor state
    const [isEditingVendor, setIsEditingVendor] = useState(false);
    const [editVendorData, setEditVendorData] = useState({});

    // Add/Edit product state
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productFormData, setProductFormData] = useState({
        name: '', category: '', cost: '', salePrice: '', description: '', taxes: []
    });

    // Dialogs
    const [alertDialog, setAlertDialog] = useState({ open: false, title: '', message: '', severity: 'info' });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (open && vendorId) {
            fetchVendorDetails();
            fetchTransactions();
            fetchPurchases();
            fetchProducts();
            setActiveTab(0);
            setIsEditingVendor(false);
            setShowProductForm(false);
            setEditingProduct(null);
        }
    }, [open, vendorId]);

    const fetchVendorDetails = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/details/${vendorId}`,
                { headers: { 'Authorization': token }, withCredentials: true }
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
                { headers: { 'Authorization': token }, withCredentials: true }
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
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            setPurchases(response.data.data.purchases.map(p => ({ ...p, id: p._id })));
        } catch (error) {
            console.error('Error fetching purchases:', error);
        }
    };

    const fetchProducts = async () => {
        setProductsLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/by-vendor/${vendorId}`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            setProducts((response.data.data.products || []).map(p => ({ ...p, id: p._id })));
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setProductsLoading(false);
        }
    };

    // ─── Vendor Edit ───
    const handleEditVendor = () => {
        setEditVendorData({
            name: vendor.name || '',
            email: vendor.email || '',
            phone: vendor.phone || '',
            address: vendor.address || '',
            city: vendor.city || '',
            state: vendor.state || '',
            gstNumber: vendor.gstNumber || ''
        });
        setIsEditingVendor(true);
    };

    const handleSaveVendor = async () => {
        try {
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/update/${vendorId}`,
                editVendorData,
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            setAlertDialog({ open: true, title: 'Success', message: 'Vendor updated successfully', severity: 'success' });
            setIsEditingVendor(false);
            fetchVendorDetails();
        } catch (error) {
            setAlertDialog({ open: true, title: 'Error', message: error.response?.data?.message || 'Error updating vendor', severity: 'error' });
        }
    };

    // ─── Product CRUD ───
    const resetProductForm = () => {
        setProductFormData({ name: '', category: '', cost: '', salePrice: '', description: '', taxes: [] });
        setEditingProduct(null);
        setShowProductForm(false);
    };

    const handleAddProductClick = () => {
        resetProductForm();
        setShowProductForm(true);
    };

    const handleEditProduct = (product) => {
        setProductFormData({
            name: product.name || '',
            category: product.category || '',
            cost: product.cost || '',
            salePrice: product.salePrice || '',
            description: product.description || '',
            taxes: product.taxes || []
        });
        setEditingProduct(product);
        setShowProductForm(true);
    };

    const handleSaveProduct = async () => {
        if (!productFormData.name || !productFormData.category || !productFormData.cost || !productFormData.salePrice) {
            setAlertDialog({ open: true, title: 'Validation Error', message: 'Please fill all required fields', severity: 'warning' });
            return;
        }

        const payload = {
            ...productFormData,
            cost: parseFloat(productFormData.cost),
            salePrice: parseFloat(productFormData.salePrice),
            vendor: vendorId
        };

        try {
            if (editingProduct) {
                await axios.put(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/update-product/${editingProduct._id}`,
                    payload,
                    { headers: { 'Authorization': `Bearer ${token}` }, withCredentials: true }
                );
                setAlertDialog({ open: true, title: 'Success', message: 'Product updated successfully', severity: 'success' });
            } else {
                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/add-product`,
                    payload,
                    { headers: { 'Authorization': `Bearer ${token}` }, withCredentials: true }
                );
                setAlertDialog({ open: true, title: 'Success', message: 'Product created successfully', severity: 'success' });
            }
            resetProductForm();
            fetchProducts();
        } catch (error) {
            setAlertDialog({ open: true, title: 'Error', message: error.response?.data?.message || 'Error saving product', severity: 'error' });
        }
    };

    const handleDeleteProduct = (productId) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Product',
            message: 'Are you sure you want to delete this product?',
            onConfirm: async () => {
                try {
                    await axios.delete(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/product/delete-product/${productId}`,
                        { headers: { 'Authorization': `Bearer ${token}` }, withCredentials: true }
                    );
                    setAlertDialog({ open: true, title: 'Success', message: 'Product deleted', severity: 'success' });
                    fetchProducts();
                } catch (error) {
                    setAlertDialog({ open: true, title: 'Error', message: 'Error deleting product', severity: 'error' });
                }
                setConfirmDialog({ ...confirmDialog, open: false });
            }
        });
    };

    const handleAddProductTax = () => {
        setProductFormData({ ...productFormData, taxes: [...productFormData.taxes, { name: '', rate: 0 }] });
    };

    const handleProductTaxChange = (index, field, value) => {
        const newTaxes = [...productFormData.taxes];
        newTaxes[index][field] = field === 'rate' ? parseFloat(value) || 0 : value;
        setProductFormData({ ...productFormData, taxes: newTaxes });
    };

    const handleRemoveProductTax = (index) => {
        setProductFormData({ ...productFormData, taxes: productFormData.taxes.filter((_, i) => i !== index) });
    };

    const handlePaymentSuccess = () => {
        setPaymentDialogOpen(false);
        fetchVendorDetails();
        fetchTransactions();
    };

    // ─── Column Definitions ───
    const transactionColumns = [
        { field: 'date', headerName: 'Date', width: 120, valueFormatter: (value) => new Date(value).toLocaleDateString() },
        {
            field: 'type', headerName: 'Type', width: 110,
            renderCell: (params) => (
                <Chip label={params.value?.toUpperCase()} color={params.value === 'payment' ? 'success' : 'primary'} size="small" variant="filled" />
            )
        },
        { field: 'description', headerName: 'Description', width: 250 },
        {
            field: 'amount', headerName: 'Amount', width: 130,
            renderCell: (params) => (
                <Typography fontWeight={600} color={params.value < 0 ? 'success.main' : 'warning.main'}>
                    ₹{Math.abs(params.value).toLocaleString('en-IN')}
                </Typography>
            )
        },
        { field: 'balanceAfter', headerName: 'Balance After', width: 130, valueFormatter: (value) => `₹${(value || 0).toLocaleString('en-IN')}` }
    ];

    const purchaseColumns = [
        { field: 'item', headerName: 'Item', width: 200 },
        { field: 'stockRemain', headerName: 'Qty', width: 80, type: 'number' },
        { field: 'cost', headerName: 'Cost', width: 120, valueFormatter: (value) => `₹${(value || 0).toLocaleString('en-IN')}` },
        { field: 'purchaseAmount', headerName: 'Total', width: 130, valueFormatter: (value) => `₹${(value || 0).toLocaleString('en-IN')}` },
        {
            field: 'paid', headerName: 'Status', width: 110,
            renderCell: (params) => (
                <Chip label={params.value ? 'Paid' : 'Unpaid'} color={params.value ? 'success' : 'warning'} size="small" variant="filled" />
            )
        }
    ];

    const productColumns = [
        { field: 'name', headerName: 'Product Name', width: 180 },
        { field: 'category', headerName: 'Category', width: 130 },
        { field: 'cost', headerName: 'Cost', width: 110, type: 'number', valueFormatter: (value) => `₹${(value || 0).toLocaleString('en-IN')}` },
        { field: 'salePrice', headerName: 'Sale Price', width: 110, type: 'number', valueFormatter: (value) => `₹${(value || 0).toLocaleString('en-IN')}` },
        {
            field: 'margin', headerName: 'Margin', width: 100, type: 'number',
            valueGetter: (value, row) => {
                const c = row.cost || 0;
                const s = row.salePrice || 0;
                return c > 0 ? ((s - c) / c * 100).toFixed(1) : 0;
            },
            renderCell: (params) => (
                <Chip label={`${params.value}%`} color={params.value > 30 ? 'success' : params.value > 15 ? 'warning' : 'default'} size="small" />
            )
        },
        {
            field: 'taxes', headerName: 'Taxes', width: 180,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {params.value?.length > 0 ? params.value.map((tax, idx) => (
                        <Chip key={idx} label={`${tax.name}: ${tax.rate}%`} size="small" variant="outlined" />
                    )) : <Typography variant="body2" color="text.secondary">—</Typography>}
                </Box>
            )
        },
        {
            field: 'actions', headerName: 'Actions', width: 110, sortable: false, filterable: false,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEditProduct(params.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteProduct(params.row._id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
            )
        }
    ];

    // ─── Stat Card Component ───
    const StatCard = ({ icon, label, value, color = 'primary.main', bgColor }) => (
        <Card sx={{
            background: bgColor || `linear-gradient(135deg, ${alpha(color === 'warning.main' ? '#ed6c02' : color === 'success.main' ? '#2e7d32' : '#1976d2', 0.08)} 0%, ${alpha(color === 'warning.main' ? '#ed6c02' : color === 'success.main' ? '#2e7d32' : '#1976d2', 0.02)} 100%)`,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
        }}>
            <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    {icon}
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
            </CardContent>
        </Card>
    );

    if (!vendor) return null;

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
                PaperProps={{ sx: { borderRadius: 3, minHeight: '70vh' } }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                            {isEditingVendor ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Grid container spacing={1.5}>
                                        <Grid item xs={6}><TextField size="small" label="Vendor Name" value={editVendorData.name} onChange={(e) => setEditVendorData({ ...editVendorData, name: e.target.value })} fullWidth required /></Grid>
                                        <Grid item xs={6}><TextField size="small" label="Email" value={editVendorData.email} onChange={(e) => setEditVendorData({ ...editVendorData, email: e.target.value })} fullWidth /></Grid>
                                        <Grid item xs={4}><TextField size="small" label="Phone" value={editVendorData.phone} onChange={(e) => setEditVendorData({ ...editVendorData, phone: e.target.value })} fullWidth /></Grid>
                                        <Grid item xs={4}><TextField size="small" label="City" value={editVendorData.city} onChange={(e) => setEditVendorData({ ...editVendorData, city: e.target.value })} fullWidth /></Grid>
                                        <Grid item xs={4}><TextField size="small" label="State" value={editVendorData.state} onChange={(e) => setEditVendorData({ ...editVendorData, state: e.target.value })} fullWidth /></Grid>
                                        <Grid item xs={6}><TextField size="small" label="GST Number" value={editVendorData.gstNumber} onChange={(e) => setEditVendorData({ ...editVendorData, gstNumber: e.target.value })} fullWidth /></Grid>
                                        <Grid item xs={6}><TextField size="small" label="Address" value={editVendorData.address} onChange={(e) => setEditVendorData({ ...editVendorData, address: e.target.value })} fullWidth /></Grid>
                                    </Grid>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={handleSaveVendor}>Save</Button>
                                        <Button size="small" variant="outlined" startIcon={<CancelIcon />} onClick={() => setIsEditingVendor(false)}>Cancel</Button>
                                    </Box>
                                </Box>
                            ) : (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="h5" fontWeight={700}>{vendor.name}</Typography>
                                        <Tooltip title="Edit Vendor">
                                            <IconButton size="small" onClick={handleEditVendor}><EditIcon fontSize="small" /></IconButton>
                                        </Tooltip>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {[vendor.email, vendor.phone, vendor.city, vendor.gstNumber ? `GST: ${vendor.gstNumber}` : null].filter(Boolean).join(' • ')}
                                    </Typography>
                                </>
                            )}
                        </Box>
                        <IconButton onClick={onClose}><CloseIcon /></IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 2 }}>
                    {/* Stat Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}>
                            <StatCard
                                icon={<AccountBalanceWalletIcon sx={{ color: stats?.balance > 0 ? 'warning.main' : 'success.main', fontSize: 20 }} />}
                                label="Balance (Owed)"
                                value={`₹${(stats?.balance || 0).toLocaleString('en-IN')}`}
                                color={stats?.balance > 0 ? 'warning.main' : 'success.main'}
                            />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard
                                icon={<ShoppingCartIcon sx={{ color: 'primary.main', fontSize: 20 }} />}
                                label="Total Purchases"
                                value={`₹${(stats?.totalPurchases || 0).toLocaleString('en-IN')}`}
                            />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard
                                icon={<ReceiptLongIcon sx={{ color: 'success.main', fontSize: 20 }} />}
                                label="Total Paid"
                                value={`₹${(stats?.totalPaid || 0).toLocaleString('en-IN')}`}
                                color="success.main"
                            />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard
                                icon={<CategoryIcon sx={{ color: 'primary.main', fontSize: 20 }} />}
                                label="Products"
                                value={products.length}
                            />
                        </Grid>
                    </Grid>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Button variant="contained" startIcon={<PaymentIcon />} onClick={() => setPaymentDialogOpen(true)} disabled={stats?.balance <= 0} size="small">
                            Record Payment
                        </Button>
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}
                            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
                        >
                            <Tab icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Transactions" />
                            <Tab icon={<InventoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Purchases" />
                            <Tab icon={<CategoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Products (${products.length})`} />
                        </Tabs>
                    </Box>

                    {/* Tab Content */}
                    {activeTab === 0 && (
                        <Box sx={{ mt: 2 }}>
                            <DataGrid rows={transactions} columns={transactionColumns} autoHeight
                                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick
                                sx={{ border: 'none', '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f0f0' } }}
                            />
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box sx={{ mt: 2 }}>
                            <DataGrid rows={purchases} columns={purchaseColumns} autoHeight
                                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick
                                sx={{ border: 'none', '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f0f0' } }}
                            />
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Box sx={{ mt: 2 }}>
                            {/* Add Product Button */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={handleAddProductClick}>
                                    Add Product
                                </Button>
                            </Box>

                            {/* Inline Product Form */}
                            {showProductForm && (
                                <Card sx={{ mb: 3, p: 2.5, border: '2px solid', borderColor: 'primary.light', borderRadius: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                                        {editingProduct ? 'Edit Product' : 'New Product'}
                                    </Typography>
                                    <Grid container spacing={1.5}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField size="small" label="Product Name *" value={productFormData.name}
                                                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })} fullWidth />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField size="small" label="Category *" value={productFormData.category}
                                                onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })} fullWidth />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField size="small" label="Cost Price *" type="number" value={productFormData.cost}
                                                onChange={(e) => setProductFormData({ ...productFormData, cost: e.target.value })} fullWidth inputProps={{ min: 0, step: 0.01 }} />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField size="small" label="Sale Price *" type="number" value={productFormData.salePrice}
                                                onChange={(e) => setProductFormData({ ...productFormData, salePrice: e.target.value })} fullWidth inputProps={{ min: 0, step: 0.01 }} />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField size="small" label="Description" value={productFormData.description}
                                                onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })} fullWidth />
                                        </Grid>

                                        {/* Inline Tax Section */}
                                        <Grid item xs={12}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="body2" fontWeight={600}>Taxes</Typography>
                                                <Button size="small" startIcon={<AddIcon />} onClick={handleAddProductTax}>Add Tax</Button>
                                            </Box>
                                            {productFormData.taxes.map((tax, idx) => (
                                                <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                                    <TextField size="small" label="Tax Name" value={tax.name}
                                                        onChange={(e) => handleProductTaxChange(idx, 'name', e.target.value)} sx={{ flex: 1 }} />
                                                    <TextField size="small" label="Rate (%)" type="number" value={tax.rate}
                                                        onChange={(e) => handleProductTaxChange(idx, 'rate', e.target.value)} sx={{ width: 100 }}
                                                        inputProps={{ min: 0, max: 100, step: 0.01 }} />
                                                    <IconButton size="small" color="error" onClick={() => handleRemoveProductTax(idx)}><DeleteIcon fontSize="small" /></IconButton>
                                                </Box>
                                            ))}
                                        </Grid>
                                    </Grid>
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                                        <Button size="small" variant="outlined" onClick={resetProductForm}>Cancel</Button>
                                        <Button size="small" variant="contained" onClick={handleSaveProduct}>
                                            {editingProduct ? 'Update Product' : 'Create Product'}
                                        </Button>
                                    </Box>
                                </Card>
                            )}

                            {/* Products DataGrid */}
                            <DataGrid rows={products} columns={productColumns} autoHeight loading={productsLoading}
                                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick
                                sx={{ border: 'none', '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f0f0' } }}
                            />
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <AddVendorPayment
                open={paymentDialogOpen}
                onClose={() => setPaymentDialogOpen(false)}
                vendorId={vendorId}
                vendorName={vendor?.name}
                currentBalance={stats?.balance || 0}
                onSuccess={handlePaymentSuccess}
            />

            <AlertDialog
                open={alertDialog.open}
                onClose={() => setAlertDialog({ ...alertDialog, open: false })}
                title={alertDialog.title}
                message={alertDialog.message}
                severity={alertDialog.severity}
            />

            <ConfirmDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />
        </>
    );
};

export default VendorDetailsModal;
