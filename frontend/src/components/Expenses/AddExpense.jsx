import axios from "axios";
import { useState } from "react";
import { Box, TextField } from '@mui/material';
import AlertDialog from '../shared/AlertDialog.jsx';

function AddExpense() {
    const [formData, setFormData] = useState({
        name: '',
        expAmount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    const handleAddExpense = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.expAmount || !formData.description || !formData.date) {
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
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/add-expense`,
                formData,
                { withCredentials: true }
            );
            if (response.data.statusCode === 200) {
                setAlertDialog({
                    open: true,
                    title: "Success",
                    message: "Expense added successfully!",
                    severity: "success"
                });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (error) {
            console.error("Error while adding expense", error.response?.data || error.message);
            setAlertDialog({
                open: true,
                title: "Error",
                message: error.response?.data?.message || "Error adding expense",
                severity: "error"
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleAddExpense} sx={{ p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 2, alignItems: 'start' }}>
                <TextField
                    label="Item"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    fullWidth
                />
                <TextField
                    label="Amount"
                    type="number"
                    value={formData.expAmount}
                    onChange={(e) => setFormData({ ...formData, expAmount: e.target.value })}
                    required
                    fullWidth
                />
                <TextField
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    fullWidth
                />
                <TextField
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />
                <button type="submit"
                    className="px-5 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium text-white whitespace-nowrap">
                    Add Expense
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

export default AddExpense;