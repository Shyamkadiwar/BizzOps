import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Chip, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DollarSign, AlertCircle } from 'lucide-react';
import Layout from "../Layout";

function Payment() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paid, setPaid] = useState(0);
    const [unPaid, setUnPaid] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [paidRes, unpaidRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/paid-invoice`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/unpaid-invoice`, { withCredentials: true })
            ]);
            setPaid(paidRes.data.data.totalPaidAmount || 0);
            setUnPaid(unpaidRes.data.data.totalUnpaidAmount || 0);

            const paidInvoices = (paidRes.data.data.paidInvoices || []).map(inv => ({
                ...inv,
                id: inv._id,
                itemCount: inv.items?.length || 0,
                itemNames: inv.items?.map(i => i.itemName).join(', ') || 'N/A'
            }));
            setInvoices(paidInvoices);
        } catch (error) {
            console.error('Error fetching payment data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const columns = [
        { field: 'name', headerName: 'Customer', width: 180, filterable: true },
        { field: 'itemNames', headerName: 'Items', width: 250 },
        { field: 'itemCount', headerName: 'Qty', width: 80, type: 'number' },
        {
            field: 'subTotal', headerName: 'Subtotal', width: 130, type: 'number',
            valueFormatter: (value) => `₹${(value || 0).toLocaleString()}`
        },
        {
            field: 'grandTotal', headerName: 'Grand Total', width: 140, type: 'number',
            renderCell: (params) => (
                <span className="font-bold text-gray-900">₹{(params.value || 0).toLocaleString()}</span>
            )
        },
        {
            field: 'paid', headerName: 'Status', width: 110,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Paid' : 'Unpaid'}
                    color={params.value ? 'success' : 'warning'}
                    size="small" variant="filled"
                />
            )
        },
        {
            field: 'date', headerName: 'Date', width: 130,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
        }
    ];

    const StatCard = ({ icon, label, value, color }) => (
        <div className="bg-white/70 backdrop-blur-md  rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}20`, color }}
                >
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">{label}</p>
                    <h3 className="text-xl font-bold text-gray-900">₹{value.toLocaleString()}</h3>
                </div>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
                    <p className="text-sm text-gray-600">Invoice and payment tracking</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <StatCard icon={<DollarSign size={20} />} label="Total Paid" value={paid} color="#10B981" />
                    <StatCard icon={<AlertCircle size={20} />} label="Total Unpaid" value={unPaid} color="#F59E0B" />
                </div>

                <div className="bg-white/70 backdrop-blur-md  rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Records</h3>
                    <Box sx={{ height: 500, width: '100%' }}>
                        <DataGrid
                            rows={invoices} columns={columns} loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]} disableRowSelectionOnClick
                            sx={{ border: 'none', '& .MuiDataGrid-cell': { borderBottom: '1px solid #f3f4f6' } }}
                        />
                    </Box>
                </div>
            </div>
        </Layout>
    );
}

export default Payment;