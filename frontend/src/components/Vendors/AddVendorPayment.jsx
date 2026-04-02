import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography
} from '@mui/material';
import axios from 'axios';
import AlertDialog from '../shared/AlertDialog';

const AddVendorPayment = ({ open, onClose, vendorId, vendorName, currentBalance, onSuccess }) => {
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: '', message: '', severity: 'info' });
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem('accessToken');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setAlertDialog({
                open: true,
                title: 'Validation Error',
                message: 'Please enter a valid payment amount',
                severity: 'warning'
            });
            return;
        }

        if (parseFloat(formData.amount) > currentBalance) {
            setAlertDialog({
                open: true,
                title: 'Validation Error',
                message: 'Payment amount cannot exceed current balance',
                severity: 'warning'
            });
            return;
        }

        setLoading(true);
        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/payment/${vendorId}`,
                formData,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true
                }
            );

            setAlertDialog({
                open: true,
                title: 'Success',
                message: 'Payment recorded successfully',
                severity: 'success'
            });

            setTimeout(() => {
                setFormData({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
                onSuccess();
            }, 1500);
        } catch (error) {
            console.error('Error recording payment:', error);
            setAlertDialog({
                open: true,
                title: 'Error',
                message: error.response?.data?.message || 'Error recording payment',
                severity: 'error'
            });
        } finally {
            setLoading(false);
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
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        Record Payment — {vendorName}
                    </Typography>
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box sx={{ background: '#f8fafc', p: 2, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                    Current Balance (Owed): 
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#ef4444', mt: 0.5 }}>
                                    ₹{currentBalance.toLocaleString('en-IN')}
                                </Typography>
                            </Box>

                            <TextField
                                label="Payment Amount"
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                                fullWidth
                                inputProps={{ min: 0, step: 0.01, max: currentBalance }}
                            />

                            <TextField
                                label="Payment Date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                label="Description (Optional)"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                fullWidth
                                multiline
                                rows={2}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 4, pb: 3, pt: 2, gap: 1, background: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <Button onClick={onClose} sx={{ mr: 'auto', color: '#64748b', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            disabled={loading}
                            sx={{
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                                color: '#fff', textTransform: 'none', fontWeight: 600, borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                                px: 3,
                                '&:hover': { background: 'linear-gradient(135deg, #000000 0%, #0f172a 100%)' }
                            }}
                        >
                            {loading ? 'Processing...' : 'Record Payment'}
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

export default AddVendorPayment;
