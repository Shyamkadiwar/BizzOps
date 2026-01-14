import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, Typography, Chip, Button, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Download as DownloadIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddMultiItemSale from "./AddMultiItemSale.jsx";
import MuiModal from "../shared/MuiModal";
import Layout from "../Layout.jsx";
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import CustomerDetailsModal from '../Customers/CustomerDetailsModal.jsx';

const token = localStorage.getItem('accessToken');

function Sales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-sale/alltime?limit=1000`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );

            if (response.status === 200 && response.data && response.data.data) {
                const salesData = response.data.data.sales || [];
                setSales(salesData.map(sale => ({ ...sale, id: sale._id })));
            }
        } catch (error) {
            console.error('Failed to fetch sales:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const handleSaleAdded = (newSale) => {
        setOpenModal(false);
        fetchSales();
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/export/sales`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true,
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'sales.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export sales');
        }
    };

    const handleDelete = async (id) => {
        setConfirmDialog({
            open: true,
            title: "Delete Sale",
            message: "Are you sure you want to delete this sale? This will also delete the associated invoice.",
            onConfirm: async () => {
                try {
                    await axios.delete(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/delete-sale/${id}`,
                        { headers: { 'Authorization': token }, withCredentials: true }
                    );
                    fetchSales();
                } catch (error) {
                    console.error('Delete failed:', error);
                    alert('Failed to delete sale');
                }
                setConfirmDialog({ ...confirmDialog, open: false });
            }
        });
    };

    const columns = [
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueFormatter: (value) => new Date(value).toLocaleDateString()
        },
        { field: 'productName', headerName: 'Product', width: 180, filterable: true },
        {
            field: 'customerName',
            headerName: 'Customer',
            width: 150,
            filterable: true,
            renderCell: (params) => params.row.customer ? (
                <Typography
                    sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => {
                        // Extract customer ID - it might be an object or a string
                        const customerId = typeof params.row.customer === 'object'
                            ? params.row.customer._id
                            : params.row.customer;
                        setSelectedCustomer(customerId);
                        setCustomerDetailsOpen(true);
                    }}
                >
                    {params.value || 'Walk-in'}
                </Typography>
            ) : (params.value || 'Walk-in')
        },
        {
            field: 'qty',
            headerName: 'Quantity',
            width: 100,
            type: 'number',
            renderCell: (params) => (
                <Chip label={params.value} color="primary" size="small" />
            )
        },
        {
            field: 'cost',
            headerName: 'Cost',
            width: 100,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`
        },
        {
            field: 'price',
            headerName: 'Price',
            width: 100,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`
        },
        {
            field: 'profitPercent',
            headerName: 'Profit %',
            width: 100,
            type: 'number',
            renderCell: (params) => (
                <Chip
                    label={`${params.value?.toFixed(2)}%`}
                    color={params.value > 20 ? 'success' : params.value > 10 ? 'warning' : 'default'}
                    size="small"
                />
            )
        },
        {
            field: 'profit',
            headerName: 'Profit',
            width: 120,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`,
            cellClassName: 'font-bold text-green-600'
        },
        {
            field: 'sale',
            headerName: 'Total Sale',
            width: 120,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`,
            cellClassName: 'font-bold text-blue-600'
        },
        {
            field: 'invoice',
            headerName: 'Invoice',
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Created' : 'Pending'}
                    color={params.value ? 'success' : 'warning'}
                    size="small"
                />
            )
        },
        {
            field: 'taxes',
            headerName: 'Taxes',
            width: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {params.value && params.value.length > 0 ? (
                        params.value.map((tax, idx) => (
                            <Chip
                                key={idx}
                                label={`${tax.name}: ${tax.rate}%`}
                                size="small"
                                variant="outlined"
                                color="info"
                            />
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 80,
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
        <Layout>
            <Box sx={{ p: 3 }}>
                {/* Header with Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Sales Management
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenModal(true)}
                            color="primary"
                        >
                            Add
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleExport}
                            color="warning"
                        >
                            Export
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={sales}
                        columns={columns}
                        loading={loading}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10, page: 0 },
                            },
                        }}
                        pageSizeOptions={[10, 25, 50, 100]}
                        disableRowSelectionOnClick
                    />
                </Box>
            </Box>

            <MuiModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                title="Add Sale"
            >
                <AddMultiItemSale addNewSale={handleSaleAdded} onCancel={() => setOpenModal(false)} />
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
                }}
                customerId={selectedCustomer}
            />
        </Layout>
    );
}

export default Sales;