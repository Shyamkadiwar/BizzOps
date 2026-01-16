import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, Typography, Chip, IconButton, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Download as DownloadIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import Layout from "../Layout.jsx";

const token = localStorage.getItem('accessToken');

function Invoice() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/get-invoice?limit=1000`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );

            if (response.status === 200 && response.data && response.data.data) {
                const invoicesData = response.data.data.invoices || [];
                setInvoices(invoicesData.map(invoice => ({ ...invoice, id: invoice._id })));
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleTogglePaid = async (id, currentStatus) => {
        try {
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/invoices/${id}/toggle-paid`,
                {},
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            fetchInvoices();
        } catch (error) {
            console.error('Error updating invoice:', error);
            alert('Error updating invoice status');
        }
    };

    const handleDownloadInvoice = async (invoiceId) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/download/${invoiceId}`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true,
                    responseType: 'blob'  // Changed to blob for PDF
                }
            );

            // Create blob and download PDF
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download invoice PDF. Please try again.');
        }
    };

    const handleExportAll = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/export/invoices`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true,
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'invoices.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export invoices');
        }
    };

    const columns = [
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
        },
        { field: 'customerName', headerName: 'Customer', width: 180, filterable: true },
        {
            field: 'items',
            headerName: 'Items',
            width: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {params.value?.map((item, idx) => (
                        <Chip key={idx} label={`${item.itemName} (${item.qty})`} size="small" variant="outlined" />
                    ))}
                </Box>
            )
        },
        {
            field: 'subTotal',
            headerName: 'Sub Total',
            width: 120,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`
        },
        {
            field: 'grandTotal',
            headerName: 'Grand Total',
            width: 130,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`,
            cellClassName: 'font-bold text-blue-600'
        },
        {
            field: 'paid',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Paid' : 'Unpaid'}
                    color={params.value ? 'success' : 'warning'}
                    size="small"
                    onClick={() => handleTogglePaid(params.row._id, params.value)}
                    sx={{ cursor: 'pointer' }}
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadInvoice(params.row._id)}
                    variant="outlined"
                >
                    PDF
                </Button>
            )
        }
    ];

    return (
        <Layout>
            <Box sx={{ p: 6, background: '#F5F5F5' }}>
                {/* Header with Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Invoice Management
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportAll}
                        color="warning"
                    >
                        Export
                    </Button>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Invoices are automatically created from sales. Click on status to toggle paid/unpaid.
                </Typography>

                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={invoices}
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
        </Layout>
    );
}

export default Invoice;