import React, { useState } from "react";
import axios from "axios";
import { Box, TextField } from '@mui/material';
import AlertDialog from '../shared/AlertDialog.jsx';

function AddStaff({ onStaffAdded }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        salary: ''
    });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    const handleAddStaff = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.phone || !formData.salary) {
            setAlertDialog({
                open: true,
                title: "Validation Error",
                message: "Please fill all required fields",
                severity: "warning"
            });
            return;
        }

        const data = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            salary: Number(formData.salary),
            debitCreditHistory: Number(formData.salary)
        };

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/staff/add-staff`,
                data,
                { withCredentials: true }
            );
            if (response.data.statusCode === 200) {
                onStaffAdded(response.data.data);
                setAlertDialog({
                    open: true,
                    title: "Success",
                    message: "Staff added successfully!",
                    severity: "success"
                });
                setFormData({ name: '', email: '', phone: '', salary: '' });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (error) {
            console.error("Error while adding staff", error.response?.data || error.message);
            setAlertDialog({
                open: true,
                title: "Error",
                message: error.response?.data?.message || "Error adding staff",
                severity: "error"
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleAddStaff} sx={{ p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 2, alignItems: 'start' }}>
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
                <TextField
                    label="Salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    required
                    fullWidth
                />
                <button type="submit"
                    className="px-5 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium text-white whitespace-nowrap">
                    Add Staff
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
}

export default AddStaff;