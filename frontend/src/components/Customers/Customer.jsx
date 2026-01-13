import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, Typography, IconButton, Button, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCustomers from "./AddCustomers.jsx";
import ProfessionalDataGrid from "../shared/ProfessionalDataGrid";
import MuiModal from "../shared/MuiModal";
import Sidebar from "../Sidebar.jsx";
import CustomBtn from "../CustomBtn.jsx";
import Account from "../Account.jsx";
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import CustomerDetailsModal from './CustomerDetailsModal.jsx';

const token = localStorage.getItem('accessToken');

function Customer() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/get-customer?limit=1000`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );

            if (response.status === 200 && response.data && response.data.data) {
                const customersData = response.data.data.customers || [];
                setCustomers(customersData.map(customer => ({ ...customer, id: customer._id })));
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleCustomerAdded = () => {
        setOpenModal(false);
        fetchCustomers();
    };

    const handleDelete = async (id) => {
        setConfirmDialog({
            open: true,
            title: "Delete Customer",
            message: "Are you sure you want to delete this customer?",
            onConfirm: async () => {
                try {
                    await axios.delete(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/delete-customer/${id}`,
                        { headers: { 'Authorization': token }, withCredentials: true }
                    );
                    fetchCustomers();
                } catch (error) {
                    console.error('Error deleting customer:', error);
                }
                setConfirmDialog({ ...confirmDialog, open: false });
            }
        });
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/export/customers`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true,
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'customers.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export customers');
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
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/import/customers`,
                    formData,
                    {
                        headers: {
                            'Authorization': token,
                            'Content-Type': 'multipart/form-data'
                        },
                        withCredentials: true
                    }
                );

                alert(`Import successful! ${response.data.data.success.length} customers imported.`);
                fetchCustomers();
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to import customers');
            }
        };
        input.click();
    };

    const columns = [
        {
            field: 'name',
            headerName: 'Name',
            width: 150,
            filterable: true,
            renderCell: (params) => (
                <Typography
                    sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => {
                        setSelectedCustomer(params.row._id);
                        setCustomerDetailsOpen(true);
                    }}
                >
                    {params.value}
                </Typography>
            )
        },
        { field: 'email', headerName: 'Email', width: 200, filterable: true },
        { field: 'phone', headerName: 'Phone', width: 130 },
        { field: 'city', headerName: 'City', width: 120, filterable: true },
        {
            field: 'balance',
            headerName: 'Balance',
            width: 130,
            type: 'number',
            renderCell: (params) => (
                <Chip
                    label={`₹${(params.value || 0).toLocaleString('en-IN')}`}
                    color={params.value > 0 ? 'error' : 'success'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            field: 'totalSales',
            headerName: 'Total Sales',
            width: 130,
            type: 'number',
            valueFormatter: (value) => `₹${(value || 0).toLocaleString('en-IN')}`
        },
        {
            field: 'totalProfit',
            headerName: 'Total Profit',
            width: 130,
            type: 'number',
            renderCell: (params) => (
                <Chip
                    label={`₹${(params.value || 0).toLocaleString('en-IN')}`}
                    color={params.value > 0 ? 'success' : 'default'}
                    size="small"
                />
            )
        },
        { field: 'company', headerName: 'Company', width: 150, filterable: true },
        { field: 'gstNumber', headerName: 'GST Number', width: 150 },
        { field: 'state', headerName: 'State', width: 120, filterable: true },
        { field: 'address', headerName: 'Address', width: 200 },
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
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 overflow-y-auto">
                <CustomBtn />
                <Account />

                <Box sx={{ p: 3, mt: 8 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                            Customer Management
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenModal(true)}
                        >
                            Add Customer
                        </Button>
                    </Box>

                    <ProfessionalDataGrid
                        rows={customers}
                        columns={columns}
                        loading={loading}
                        onAdd={() => setOpenModal(true)}
                        onExport={handleExport}
                        onImport={handleImport}
                        pageSize={10}
                    />
                </Box>
            </div>

            <MuiModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                title="Add Customer"
            >
                <AddCustomers addNewCustomer={handleCustomerAdded} onCancel={() => setOpenModal(false)} />
            </MuiModal>

            <ConfirmDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />

            <CustomerDetailsModal
                open={customerDetailsOpen}
                onClose={() => {
                    setCustomerDetailsOpen(false);
                    setSelectedCustomer(null);
                    fetchCustomers(); // Refresh data after modal closes
                }}
                customerId={selectedCustomer}
            />
        </div>
    );
}

export default Customer;