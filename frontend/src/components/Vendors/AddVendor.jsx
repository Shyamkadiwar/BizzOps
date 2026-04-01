import React, { useState } from 'react';
import { Box, TextField } from '@mui/material';
import axios from 'axios';
import AlertDialog from '../shared/AlertDialog.jsx';

const AddVendor = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        gstNumber: ''
    });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    const token = localStorage.getItem('accessToken');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            setAlertDialog({
                open: true,
                title: "Validation Error",
                message: "Vendor name is required",
                severity: "warning"
            });
            return;
        }

        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/create`,
                formData,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true
                }
            );

            setAlertDialog({
                open: true,
                title: "Success",
                message: "Vendor added successfully",
                severity: "success"
            });

            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (error) {
            console.error('Error adding vendor:', error);
            setAlertDialog({
                open: true,
                title: "Error",
                message: error.response?.data?.message || "Error adding vendor",
                severity: "error"
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Row 1: Name | Email | Phone */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField
                        label="Vendor Name"
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
                        fullWidth
                    />
                    <TextField
                        label="Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        fullWidth
                    />
                </Box>

                {/* Row 2: City | State | GST Number */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField
                        label="City"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        label="State"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        label="GST Number"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                        fullWidth
                    />
                </Box>

                {/* Row 3: Address (Full Width) */}
                <TextField
                    label="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                <button type="button" onClick={onCancel}
                    className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700">
                    Cancel
                </button>
                <button type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium text-white">
                    Add Vendor
                </button>
            </Box>

            <AlertDialog
                open={alertDialog.open}
                onClose={() => setAlertDialog({ ...alertDialog, open: false })}
                title={alertDialog.title}
                message={alertDialog.message}
                severity={alertDialog.severity}
            />
        </Box>
    );
};

export default AddVendor;
