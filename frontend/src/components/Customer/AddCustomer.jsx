import axios from "axios";
import React, { useState } from "react";
import {
    Box,
    TextField,
    Button,
    Grid
} from '@mui/material';
import AlertDialog from '../shared/AlertDialog.jsx';

function AddCustomer({ onCustomerAdded, onCancel }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        city: "",
        address: "",
        state: "",
        pincode: "",
        gstNumber: "",
        company: "",
        notes: ""
    });

    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.phone || !formData.city) {
            setAlertDialog({
                open: true,
                title: "Validation Error",
                message: "Please fill all required fields (Name, Email, Phone, City)",
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

            if (response.status === 200) {
                setAlertDialog({
                    open: true,
                    title: "Success",
                    message: "Customer created successfully!",
                    severity: "success"
                });

                setTimeout(() => {
                    onCustomerAdded(response.data.data.customer);
                }, 1500);

                // Reset form
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    city: "",
                    address: "",
                    state: "",
                    pincode: "",
                    gstNumber: "",
                    company: "",
                    notes: ""
                });
            }
        } catch (error) {
            console.error("Error creating customer:", error.response?.data || error.message);
            setAlertDialog({
                open: true,
                title: "Error",
                message: error.response?.data?.message || "Error creating customer",
                severity: "error"
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Grid container spacing={2}>
                {/* Name */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Name *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        fullWidth
                    />
                </Grid>

                {/* Email */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Email *"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        fullWidth
                    />
                </Grid>

                {/* Phone */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Phone *"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        fullWidth
                    />
                </Grid>

                {/* City */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="City *"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                        fullWidth
                    />
                </Grid>

                {/* Address */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        fullWidth
                    />
                </Grid>

                {/* State */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="State"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        fullWidth
                    />
                </Grid>

                {/* Pincode */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Pincode"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        fullWidth
                    />
                </Grid>

                {/* Company */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        fullWidth
                    />
                </Grid>

                {/* GST Number */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="GST Number"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                        fullWidth
                    />
                </Grid>

                {/* Notes */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        fullWidth
                        multiline
                        rows={1}
                    />
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                {onCancel && (
                    <Button onClick={onCancel} variant="outlined">
                        Cancel
                    </Button>
                )}
                <Button type="submit" variant="contained">
                    Create Customer
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

export default AddCustomer;
