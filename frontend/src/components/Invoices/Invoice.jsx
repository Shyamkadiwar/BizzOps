import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Box, Typography, Paper, Chip, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Download } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/Delete';
import Layout from "../Layout.jsx";
import ProfessionalDataGrid from "../shared/ProfessionalDataGrid.jsx";

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
            const invoice = invoices.find(inv => inv._id === invoiceId);
            if (!invoice || !invoice.items) {
                alert('Invoice data not found');
                return;
            }

            // Fetch user details
            let userDetails = {};
            try {
                const userRes = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/get-details`,
                    { headers: { 'Authorization': token }, withCredentials: true }
                );
                if (userRes.data.statusCode === 200) {
                    userDetails = userRes.data.data;
                }
            } catch (e) {
                console.warn('Could not fetch user details');
            }

            const { default: jsPDF } = await import('jspdf');
            await import('jspdf-autotable');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 25;
            const rightEdge = pageWidth - margin;

            // Resolve customer name properly
            const customerName = invoice.customer?.name || invoice.customerName || invoice.name || 'N/A';

            // Colors
            const black = [0, 0, 0];
            const darkGray = [51, 51, 51];
            const medGray = [120, 120, 120];
            const lightGray = [180, 180, 180];
            const lineGray = [200, 200, 200];

            // ── HEADER: Thin line + "I N V O I C E" ──
            let y = 35;
            doc.setDrawColor(...black);
            doc.setLineWidth(0.4);
            doc.line(margin, y, pageWidth / 2 - 5, y);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(26);
            doc.setTextColor(...black);
            doc.text('I N V O I C E', rightEdge, y + 2, { align: 'right' });

            // ── ISSUED TO (left) + INVOICE META (right) ──
            y += 35;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(...darkGray);
            doc.text('ISSUED TO:', margin, y);

            // Invoice meta (right side)
            const metaLabelX = rightEdge - 40;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...medGray);
            doc.text('INVOICE NO:', metaLabelX, y, { align: 'right' });
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...darkGray);
            doc.text(invoice.invoiceNumber || 'N/A', rightEdge, y, { align: 'right' });

            // Customer name
            y += 7;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(...darkGray);
            doc.text(customerName, margin, y);

            // Date (right)
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...medGray);
            doc.text('DATE:', metaLabelX, y, { align: 'right' });
            doc.setTextColor(...darkGray);
            doc.text(new Date(invoice.date || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            }), rightEdge, y, { align: 'right' });

            // Customer details
            y += 5;
            doc.setFontSize(9);
            doc.setTextColor(...medGray);
            if (invoice.customerEmail) { doc.text(invoice.customerEmail, margin, y); y += 4.5; }
            if (invoice.customerPhone) { doc.text(invoice.customerPhone, margin, y); y += 4.5; }
            if (invoice.customerAddress) {
                const addrLines = doc.splitTextToSize(invoice.customerAddress, 80);
                doc.text(addrLines, margin, y);
                y += addrLines.length * 4.5;
            }

            // Status (right side)
            const statusY = y - 9;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...medGray);
            doc.text('STATUS:', metaLabelX, statusY, { align: 'right' });
            doc.setFont("helvetica", "bold");
            doc.setTextColor(invoice.paid ? 34 : 200, invoice.paid ? 139 : 30, invoice.paid ? 34 : 30);
            doc.text(invoice.paid ? 'PAID' : 'UNPAID', rightEdge, statusY, { align: 'right' });

            // ── PAY TO section ──
            y += 6;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(...darkGray);
            doc.text('PAY TO:', margin, y);

            y += 6;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...medGray);
            if (userDetails.businessName) { doc.text(userDetails.businessName, margin, y); y += 4.5; }
            if (userDetails.email) { doc.text(userDetails.email, margin, y); y += 4.5; }
            if (userDetails.phoneNo) { doc.text(`Phone: ${userDetails.phoneNo}`, margin, y); y += 4.5; }
            if (userDetails.address) { doc.text(userDetails.address, margin, y); y += 4.5; }

            // ── ITEMS TABLE - Clean minimal style ──
            y += 8;

            const tableColumns = [
                { header: 'DESCRIPTION', dataKey: 'item' },
                { header: 'UNIT PRICE', dataKey: 'price' },
                { header: 'QTY', dataKey: 'qty' },
                { header: 'TOTAL', dataKey: 'total' }
            ];

            const tableRows = invoice.items.map((item) => {
                const taxRate = item.taxes?.reduce((sum, t) => sum + (t.rate || 0), 0) || item.tax || 0;
                const baseAmount = (item.qty || 0) * (item.price || 0);
                const taxAmount = baseAmount * (taxRate / 100);
                const itemTotal = item.total || (baseAmount + taxAmount);
                return {
                    item: item.itemName || 'N/A',
                    price: (item.price || 0).toLocaleString('en-IN'),
                    qty: item.qty || 0,
                    total: `₹${itemTotal.toLocaleString('en-IN')}`
                };
            });

            doc.autoTable({
                columns: tableColumns,
                body: tableRows,
                startY: y,
                theme: 'plain',
                headStyles: {
                    fillColor: false,
                    textColor: [...darkGray],
                    fontSize: 9,
                    fontStyle: 'bold',
                    cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
                    lineWidth: { bottom: 0.5 },
                    lineColor: [...black]
                },
                columnStyles: {
                    item: { cellWidth: 'auto', halign: 'left' },
                    price: { cellWidth: 40, halign: 'center' },
                    qty: { cellWidth: 25, halign: 'center' },
                    total: { cellWidth: 40, halign: 'right' }
                },
                bodyStyles: {
                    fontSize: 9,
                    cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
                    textColor: [...darkGray],
                    lineWidth: { bottom: 0.15 },
                    lineColor: [...lineGray]
                },
                styles: {
                    overflow: 'linebreak',
                    font: 'helvetica'
                },
                margin: { left: margin, right: margin }
            });

            // ── TOTALS ──
            let finalY = doc.lastAutoTable.finalY + 4;

            // Bottom line under table
            doc.setDrawColor(...black);
            doc.setLineWidth(0.5);
            doc.line(margin, finalY, rightEdge, finalY);

            finalY += 12;
            const labelX = rightEdge - 55;
            const valueX = rightEdge;

            // SUBTOTAL
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(...darkGray);
            doc.text('SUBTOTAL', labelX, finalY, { align: 'right' });
            doc.setFont("helvetica", "normal");
            doc.text(`₹${(invoice.subTotal || 0).toLocaleString('en-IN')}`, valueX, finalY, { align: 'right' });

            // Tax
            const taxTotal = (invoice.grandTotal || 0) - (invoice.subTotal || 0);
            finalY += 8;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...medGray);
            doc.text('Tax', labelX, finalY, { align: 'right' });
            doc.setTextColor(...darkGray);
            doc.text(`₹${taxTotal.toLocaleString('en-IN')}`, valueX, finalY, { align: 'right' });

            // TOTAL
            finalY += 10;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(...black);
            doc.text('TOTAL', labelX, finalY, { align: 'right' });
            doc.text(`₹${(invoice.grandTotal || 0).toLocaleString('en-IN')}`, valueX, finalY, { align: 'right' });

            // ── PAYMENT STAMP ──
            const stampY = doc.lastAutoTable.finalY + 10;
            if (invoice.paid) {
                doc.setDrawColor(34, 139, 34);
                doc.setLineWidth(1.2);
                doc.roundedRect(margin, stampY, 40, 14, 2, 2, 'S');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.setTextColor(34, 139, 34);
                doc.text('PAID', margin + 10, stampY + 10);
            } else {
                doc.setDrawColor(200, 30, 30);
                doc.setLineWidth(1.2);
                doc.roundedRect(margin, stampY, 48, 14, 2, 2, 'S');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.setTextColor(200, 30, 30);
                doc.text('UNPAID', margin + 8, stampY + 10);
            }

            // ── TERMS & CONDITIONS ──
            finalY = Math.max(finalY, stampY + 14) + 18;

            doc.setDrawColor(...lineGray);
            doc.setLineWidth(0.2);
            doc.line(margin, finalY, rightEdge, finalY);

            finalY += 8;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(...darkGray);
            doc.text('TERMS & CONDITIONS', margin, finalY);

            finalY += 6;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(...medGray);
            doc.text('1. Payment is due within 30 days of the invoice date unless otherwise agreed.', margin, finalY);
            finalY += 4;
            doc.text('2. Please include the invoice number as a reference when making payment.', margin, finalY);
            finalY += 4;
            doc.text('3. This is a computer-generated invoice and does not require a physical signature.', margin, finalY);

            // ── THANK YOU + SIGNATURE ──
            finalY += 16;
            doc.setFont("helvetica", "italic");
            doc.setFontSize(11);
            doc.setTextColor(...darkGray);
            doc.text('Thank you for your business!', pageWidth / 2, finalY, { align: 'center' });

            // Signature line
            finalY += 14;
            doc.setDrawColor(...lightGray);
            doc.setLineWidth(0.3);
            doc.line(rightEdge - 60, finalY, rightEdge, finalY);
            finalY += 5;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(...medGray);
            doc.text('Authorized Signature', rightEdge - 30, finalY, { align: 'center' });

            // Contact footer
            const footerY = pageHeight - 12;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(...lightGray);
            const contactParts = [userDetails.businessName, userDetails.email, userDetails.phoneNo].filter(Boolean);
            if (contactParts.length > 0) {
                doc.text(contactParts.join('  •  '), pageWidth / 2, footerY, { align: 'center' });
            }

            doc.save(`Invoice_${invoice.invoiceNumber || customerName || 'download'}.pdf`);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to generate invoice PDF. Please try again.');
        }
    };

    const handleExport = async () => {
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
                <IconButton
                    size="small"
                    onClick={() => handleDownloadInvoice(params.row._id)}
                    color="primary"
                >
                    <Download size={16} />
                </IconButton>
            )
        }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                {/* Header with Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Invoice Management
                    </Typography>
                    <button onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                        <Download size={16} /> Export
                    </button>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Invoices are automatically created from sales. Click on status to toggle paid/unpaid.
                </Typography>

                <Box sx={{ height: 600, width: '100%' }}>
                    <ProfessionalDataGrid
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
            </div>
        </Layout>
    );
}

export default Invoice;