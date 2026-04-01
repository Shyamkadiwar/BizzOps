import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Checkbox,
    Chip,
    CircularProgress,
    Divider
} from '@mui/material';
import { Send as SendIcon, Sync as SyncIcon } from '@mui/icons-material';
import axios from 'axios';
import AlertDialog from '../shared/AlertDialog';

const AddCustomerPayment = ({ open, onClose, customerId, customerName, currentBalance, onSuccess }) => {
    const [unpaidInvoices, setUnpaidInvoices] = useState([]);
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [sendingLink, setSendingLink] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [alertDialog, setAlertDialog] = useState({ open: false, title: '', message: '', severity: 'info' });

    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (open && customerId) {
            // Auto-verify pending Razorpay payments when dialog opens
            handleVerifyPayments(true);
        }
    }, [open, customerId]);

    const fetchUnpaidInvoices = async () => {
        setLoadingInvoices(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/unpaid-invoices/${customerId}`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            setUnpaidInvoices(response.data.data.invoices || []);
        } catch (error) {
            console.error('Error fetching unpaid invoices:', error);
            setUnpaidInvoices([]);
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleToggleInvoice = (invoiceId) => {
        setSelectedInvoices(prev =>
            prev.includes(invoiceId)
                ? prev.filter(id => id !== invoiceId)
                : [...prev, invoiceId]
        );
    };

    const handleSelectAll = () => {
        if (selectedInvoices.length === unpaidInvoices.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(unpaidInvoices.map(inv => inv._id));
        }
    };

    const selectedTotal = unpaidInvoices
        .filter(inv => selectedInvoices.includes(inv._id))
        .reduce((sum, inv) => sum + inv.grandTotal, 0);

    // Mark as paid directly (manual payment)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedInvoices.length === 0) {
            setAlertDialog({ open: true, title: 'No Invoices Selected', message: 'Please select at least one invoice to pay.', severity: 'warning' });
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/payment/${customerId}`,
                { invoiceIds: selectedInvoices, date: paymentDate },
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            setAlertDialog({ open: true, title: 'Payment Successful', message: response.data.message || 'Invoices marked as paid.', severity: 'success' });
            setTimeout(() => { setSelectedInvoices([]); onSuccess(); }, 1500);
        } catch (error) {
            setAlertDialog({ open: true, title: 'Error', message: error.response?.data?.message || 'Error recording payment', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Send Razorpay payment link via email
    const handleSendPaymentLink = async () => {
        if (selectedInvoices.length === 0) {
            setAlertDialog({ open: true, title: 'No Invoices Selected', message: 'Please select at least one invoice to send payment link for.', severity: 'warning' });
            return;
        }

        setSendingLink(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/payment/create-link`,
                { customerId, invoiceIds: selectedInvoices },
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            const data = response.data.data;
            setAlertDialog({
                open: true,
                title: '📧 Payment Link Sent!',
                message: `Payment link for ₹${data.amount.toLocaleString('en-IN')} sent to customer's email.\n\nLink: ${data.paymentLink}`,
                severity: 'success'
            });
            setTimeout(() => { setSelectedInvoices([]); fetchUnpaidInvoices(); }, 2000);
        } catch (error) {
            setAlertDialog({ open: true, title: 'Error', message: error.response?.data?.message || 'Failed to create payment link', severity: 'error' });
        } finally {
            setSendingLink(false);
        }
    };

    // Verify pending Razorpay payments by checking Razorpay API
    const handleVerifyPayments = async (silent = false) => {
        setVerifying(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/payment/verify`,
                { customerId },
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            const data = response.data.data;

            if (data.updated > 0 && !silent) {
                setAlertDialog({
                    open: true,
                    title: '✅ Payments Verified!',
                    message: response.data.message,
                    severity: 'success'
                });
                // Refresh parent data
                setTimeout(() => onSuccess(), 1500);
            } else if (data.updated > 0 && silent) {
                // Silent mode - just refresh
                onSuccess();
                return; // onSuccess will re-open or refresh
            }
        } catch (error) {
            console.error('Error verifying payments:', error);
        } finally {
            setVerifying(false);
            // Always fetch fresh invoices after verification
            fetchUnpaidInvoices();
            setSelectedInvoices([]);
            setPaymentDate(new Date().toISOString().split('T')[0]);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Record Payment — {customerName}</span>
                        <Button
                            size="small"
                            startIcon={verifying ? <CircularProgress size={14} /> : <SyncIcon />}
                            onClick={() => handleVerifyPayments(false)}
                            disabled={verifying}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                            {verifying ? 'Checking...' : 'Verify Payments'}
                        </Button>
                    </Box>
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Balance info */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Outstanding Balance: <strong>₹{currentBalance.toLocaleString('en-IN')}</strong>
                                </Typography>
                                {selectedInvoices.length > 0 && (
                                    <Chip label={`Paying: ₹${selectedTotal.toLocaleString('en-IN')}`} color="primary" size="small" />
                                )}
                            </Box>

                            <Divider />

                            {/* Payment date */}
                            <TextField
                                label="Payment Date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                required
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />

                            <Divider />

                            {/* Unpaid invoices list */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Select Invoices to Pay
                                </Typography>
                                {unpaidInvoices.length > 0 && (
                                    <Button size="small" onClick={handleSelectAll} sx={{ textTransform: 'none' }}>
                                        {selectedInvoices.length === unpaidInvoices.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                )}
                            </Box>

                            {loadingInvoices ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={28} />
                                </Box>
                            ) : unpaidInvoices.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                    No unpaid invoices found for this customer.
                                </Typography>
                            ) : (
                                <Box sx={{ maxHeight: 300, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {unpaidInvoices.map((invoice) => {
                                        const isSelected = selectedInvoices.includes(invoice._id);
                                        const hasPaymentLink = !!invoice.razorpayPaymentLinkId;
                                        return (
                                            <Box
                                                key={invoice._id}
                                                onClick={() => handleToggleInvoice(invoice._id)}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                                                    border: '1px solid', borderColor: isSelected ? 'primary.main' : 'divider',
                                                    borderRadius: 1.5, cursor: 'pointer',
                                                    bgcolor: isSelected ? 'primary.50' : 'transparent',
                                                    transition: 'all 0.15s ease',
                                                    '&:hover': { borderColor: 'primary.main', bgcolor: isSelected ? 'primary.50' : 'action.hover' }
                                                }}
                                            >
                                                <Checkbox checked={isSelected} size="small" sx={{ p: 0 }} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                Invoice #{invoice.invoiceNumber || 'N/A'}
                                                            </Typography>
                                                            {hasPaymentLink && (
                                                                <Chip label="Link Sent" size="small" color="info" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                                                            )}
                                                        </Box>
                                                        <Typography variant="body2" fontWeight={700} color="error.main">
                                                            ₹{invoice.grandTotal.toLocaleString('en-IN')}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.3 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {invoice.name || 'No description'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN', {
                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                            }) : ''}
                                                        </Typography>
                                                    </Box>
                                                    {invoice.items && invoice.items.length > 0 && (
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                            {invoice.items.slice(0, 3).map((item, idx) => (
                                                                <Chip key={idx} label={`${item.itemName} (${item.qty})`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                                            ))}
                                                            {invoice.items.length > 3 && (
                                                                <Chip label={`+${invoice.items.length - 3} more`} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                                                            )}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}

                            {/* Total summary */}
                            {selectedInvoices.length > 0 && (
                                <>
                                    <Divider />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedInvoices.length} invoice(s) selected
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} color="primary.main">
                                            Total: ₹{selectedTotal.toLocaleString('en-IN')}
                                        </Typography>
                                    </Box>
                                </>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                        <Button onClick={onClose} sx={{ mr: 'auto' }}>Cancel</Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<SendIcon />}
                            disabled={sendingLink || selectedInvoices.length === 0}
                            onClick={handleSendPaymentLink}
                            sx={{ textTransform: 'none' }}
                        >
                            {sendingLink ? 'Sending...' : 'Send Payment Link'}
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting || selectedInvoices.length === 0}
                        >
                            {submitting ? 'Processing...' : `Pay ₹${selectedTotal.toLocaleString('en-IN')}`}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <AlertDialog
                open={alertDialog.open}
                onClose={() => setAlertDialog({ ...alertDialog, open: false })}
                title={alertDialog.title}
                message={alertDialog.message}
                severity={alertDialog.severity}
            />
        </>
    );
};

export default AddCustomerPayment;
