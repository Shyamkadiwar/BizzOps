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
            <Dialog 
                open={open} 
                onClose={onClose} 
                maxWidth="sm" 
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            Record Payment — {customerName}
                        </Typography>
                        <Button
                            size="small"
                            startIcon={verifying ? <CircularProgress size={14} sx={{ color: '#0f172a' }} /> : <SyncIcon />}
                            onClick={() => handleVerifyPayments(false)}
                            disabled={verifying}
                            sx={{ 
                                textTransform: 'none', 
                                fontSize: '13px', 
                                fontWeight: 600, 
                                background: '#f1f5f9', 
                                color: '#0f172a',
                                borderRadius: '8px',
                                px: 2, py: 0.5,
                                '&:hover': { background: '#e2e8f0' }
                            }}
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
                                                    display: 'flex', alignItems: 'center', gap: 1.5, p: 2,
                                                    border: '1px solid', borderColor: isSelected ? '#3b82f6' : 'rgba(0,0,0,0.08)',
                                                    borderRadius: '16px', cursor: 'pointer',
                                                    background: isSelected ? 'rgba(59, 130, 246, 0.04)' : '#ffffff',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
                                                    '&:hover': { borderColor: '#3b82f6', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                                                }}
                                            >
                                                <Checkbox checked={isSelected} size="small" sx={{ p: 0, color: '#cbd5e1', '&.Mui-checked': { color: '#3b82f6' } }} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                                                                #{invoice.invoiceNumber || 'N/A'}
                                                            </Typography>
                                                            {hasPaymentLink && (
                                                                <Chip label="Link Sent" size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18, color: '#3b82f6', borderColor: '#3b82f6' }} />
                                                            )}
                                                        </Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#ef4444' }}>
                                                            ₹{invoice.grandTotal.toLocaleString('en-IN')}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                            {invoice.name || 'No description'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                            {invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN', {
                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                            }) : ''}
                                                        </Typography>
                                                    </Box>
                                                    {invoice.items && invoice.items.length > 0 && (
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                                            {invoice.items.slice(0, 3).map((item, idx) => (
                                                                <Chip key={idx} label={`${item.itemName} (${item.qty})`} size="small" sx={{ fontSize: '0.65rem', height: 20, background: '#f1f5f9', color: '#475569' }} />
                                                            ))}
                                                            {invoice.items.length > 3 && (
                                                                <Chip label={`+${invoice.items.length - 3} more`} size="small" sx={{ fontSize: '0.65rem', height: 20, background: '#f1f5f9', color: '#475569' }} />
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
                    <DialogActions sx={{ px: 4, pb: 3, pt: 2, gap: 1, background: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <Button onClick={onClose} sx={{ mr: 'auto', color: '#64748b', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                        <Button
                            variant="outlined"
                            startIcon={<SendIcon />}
                            disabled={sendingLink || selectedInvoices.length === 0}
                            onClick={handleSendPaymentLink}
                            sx={{ 
                                textTransform: 'none', fontWeight: 600, borderRadius: '8px',
                                color: '#3b82f6', borderColor: '#3b82f6',
                                '&:hover': { background: 'rgba(59, 130, 246, 0.04)', borderColor: '#2563eb' }
                            }}
                        >
                            {sendingLink ? 'Sending...' : 'Send Link'}
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting || selectedInvoices.length === 0}
                            sx={{
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                                color: '#fff', textTransform: 'none', fontWeight: 600, borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                                '&:hover': { background: 'linear-gradient(135deg, #000000 0%, #0f172a 100%)' }
                            }}
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
