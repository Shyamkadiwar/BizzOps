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

const AddCustomerPayment = ({ open, onClose, customerId, customerName, currentBalance, onSuccess }) => {
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
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/payment/${customerId}`,
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
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>Record Payment - {customerName}</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Current Balance: <strong>₹{currentBalance.toLocaleString('en-IN')}</strong>
                            </Typography>

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
                    <DialogActions>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={loading}>
                            Record Payment
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
