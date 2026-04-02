import axios from "axios";
import React, { useState } from "react";
import { Box, TextField, Button } from '@mui/material';
import AlertDialog from '../shared/AlertDialog.jsx';

function AddCustomers({ addNewCustomer, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        address: '',
        gstNumber: '',
        company: '',
        state: '',
        pincode: '',
        notes: ''
    });

    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    const handleAddCustomer = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.phone || !formData.city) {
            setAlertDialog({
                open: true,
                title: "Validation Error",
                message: "Please fill all required fields",
                severity: "warning"
            });
            return;
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/add-customer`,
                formData,
                { withCredentials: true }
            );

            if (response.data.statusCode === 200) {
                setAlertDialog({
                    open: true,
                    title: "Success",
                    message: "Customer added successfully!",
                    severity: "success"
                });

                setTimeout(() => {
                    addNewCustomer();
                }, 1500);

                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    city: '',
                    address: '',
                    gstNumber: '',
                    company: '',
                    state: '',
                    pincode: '',
                    notes: ''
                });
            }
        } catch (error) {
            console.error("Error while adding customer", error.response?.data || error.message);
            setAlertDialog({
                open: true,
                title: "Error",
                message: error.response?.data?.message || "Error adding customer",
                severity: "error"
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleAddCustomer} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Row 1: Name | Email | Phone */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        fullWidth
                    />
                </Box>

                {/* Row 2: City | State | Pincode */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField
                        label="City"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                        fullWidth
                    />
                    <TextField
                        label="State"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        label="Pincode"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        fullWidth
                    />
                </Box>

                {/* Row 3: Company | GST Number (2 cols) */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField
                        label="Company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        label="GST Number"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                        fullWidth
                    />
                </Box>

                {/* Row 4: Address (Full Width) */}
                <TextField
                    label="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                />

                {/* Row 5: Notes (Full Width) */}
                <TextField
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4, pt: 3, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                {onCancel && (
                    <Button type="button" onClick={onCancel}
                        sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600, px: 3 }}>
                        Cancel
                    </Button>
                )}
                <Button type="submit"
                    sx={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        color: '#fff', textTransform: 'none', fontWeight: 600, borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                        px: 4, py: 1,
                        '&:hover': { background: 'linear-gradient(135deg, #000000 0%, #0f172a 100%)' }
                    }}>
                    Add Customer
                </Button>
            </Box>

            {/* Alert Dialog */}
            <AlertDialog
                open={alertDialog.open}
                onClose={() => setAlertDialog({ ...alertDialog, open: false })}
                title={alertDialog.title}
                message={alertDialog.message}
                severity={alertDialog.severity}
            />
        </Box>
    );
}

export default AddCustomers;