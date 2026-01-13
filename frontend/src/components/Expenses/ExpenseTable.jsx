import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, Typography, Chip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ProfessionalDataGrid from "../shared/ProfessionalDataGrid";

const token = localStorage.getItem('accessToken');

function ExpenseTable() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/get-expense`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );

            if (response.status === 200 && response.data && response.data.data) {
                // Handle both possible response structures
                const expensesData = response.data.data.expenses || response.data.data.expense || [];
                setExpenses(expensesData.map(expense => ({
                    ...expense,
                    id: expense._id,
                    category: expense.name || expense.category || 'N/A',
                    amount: expense.expAmount || expense.amount || 0
                })));
            }
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/delete-expense`,
                    { id },
                    { headers: { 'Authorization': token }, withCredentials: true }
                );
                fetchExpenses();
            } catch (error) {
                console.error('Error deleting expense:', error);
                alert('Error deleting expense');
            }
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/export/expenses`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true,
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'expenses.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export expenses');
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/import/expenses`,
                    formData,
                    {
                        headers: {
                            'Authorization': token,
                            'Content-Type': 'multipart/form-data'
                        },
                        withCredentials: true
                    }
                );

                alert(`Import successful! ${response.data.data.success.length} expenses imported.`);
                fetchExpenses();
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to import expenses');
            }
        };
        input.click();
    };

    const columns = [
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
        },
        { field: 'description', headerName: 'Description', width: 250, filterable: true },
        { field: 'category', headerName: 'Category', width: 150, filterable: true },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 150,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`,
            cellClassName: 'font-bold text-red-600'
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleDelete(params.row._id)}
                >
                    <DeleteIcon />
                </IconButton>
            )
        }
    ];

    return (
        <Box sx={{ width: '100%' }}>
            <ProfessionalDataGrid
                rows={expenses}
                columns={columns}
                loading={loading}
                onExport={handleExport}
                onImport={handleImport}
                pageSize={10}
            />
        </Box>
    );
}

export default ExpenseTable;
