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
            const margin = 20;
            const rightEdge = pageWidth - margin;

            // Load business logo if exists
            let logoBase64 = null;
            if (userDetails.businessLogo) {
                try {
                    const imgRes = await fetch(userDetails.businessLogo);
                    const blob = await imgRes.blob();
                    logoBase64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    console.warn('Failed to load logo string for PDF', e);
                }
            }

            const black = [0, 0, 0];
            let y = margin;

            // --- HEADER: Top Left (Logo & Business Info), Top Right (INVOICE, No, Date, Status) ---
            
            // LOGO
            if (logoBase64) {
                // Approximate 40x40 or proportional
                doc.addImage(logoBase64, 'JPEG', margin, y, 25, 25);
                y += 30;
            } else {
                y += 5;
            }

            // Business Name (Top-left)
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.text(userDetails.businessName || 'Business Name', margin, y);
            
            // Right Side: INVOICE title
            doc.setFontSize(28);
            doc.text('INVOICE', rightEdge, y, { align: 'right' });
            
            y += 8;
            
            // Business Details (Left)
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            
            let businessDetailsLeftY = y;
            if (userDetails.address) { doc.text(userDetails.address, margin, businessDetailsLeftY); businessDetailsLeftY += 5; }
            if (userDetails.phoneNo) { doc.text(`Phone: ${userDetails.phoneNo}`, margin, businessDetailsLeftY); businessDetailsLeftY += 5; }
            if (userDetails.email) { doc.text(`Email: ${userDetails.email}`, margin, businessDetailsLeftY); businessDetailsLeftY += 5; }
            if (userDetails.website) { doc.text(`${userDetails.website}`, margin, businessDetailsLeftY); businessDetailsLeftY += 5; }
            if (userDetails.gstNumber) { doc.text(`GST No: ${userDetails.gstNumber}`, margin, businessDetailsLeftY); businessDetailsLeftY += 5; }

            // Invoice Meta (Right)
            let metaY = y;
            const metaLabelX = rightEdge - 30;
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            
            doc.text('INVOICE #', metaLabelX, metaY, { align: 'right' });
            doc.setFont("helvetica", "normal");
            doc.text(`[${invoice.invoiceNumber || '100'}]`, rightEdge, metaY, { align: 'right' });
            
            metaY += 6;
            doc.setFont("helvetica", "bold");
            doc.text('DATE:', metaLabelX, metaY, { align: 'right' });
            doc.setFont("helvetica", "normal");
            const formattedDate = new Date(invoice.date || Date.now())
                .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                .toUpperCase();
            doc.text(formattedDate, rightEdge, metaY, { align: 'right' });

            metaY += 6;
            doc.setFont("helvetica", "bold");
            doc.text('STATUS:', metaLabelX, metaY, { align: 'right' });
            doc.setTextColor(invoice.paid ? 34 : 200, invoice.paid ? 139 : 30, invoice.paid ? 34 : 30);
            doc.text(invoice.paid ? 'PAID' : 'UNPAID', rightEdge, metaY, { align: 'right' });
            doc.setTextColor(0, 0, 0); // reset

            y = Math.max(businessDetailsLeftY, metaY) + 15;

            // --- PAY TO / SHIP TO ---
            const customerName = invoice.customerName || invoice.name || 'Walk-in Customer';
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text('TO:', margin, y);
            
            y += 6;
            doc.setFont("helvetica", "normal");
            doc.text(customerName, margin, y);
            y += 5;
            if (invoice.customerAddress) {
                const addrLines = doc.splitTextToSize(invoice.customerAddress, 60);
                doc.text(addrLines, margin, y);
                y += addrLines.length * 5;
            }
            if (invoice.customerPhone) { doc.text(invoice.customerPhone, margin, y); y += 5; }
            if (invoice.customerEmail) { doc.text(invoice.customerEmail, margin, y); y += 5; }

            y += 10;

            // --- TABLE ---
            const tableColumns = [
                { header: 'DESCRIPTION', dataKey: 'item' },
                { header: 'QUANTITY', dataKey: 'qty' },
                { header: 'UNIT PRICE', dataKey: 'price' },
                { header: 'TOTAL', dataKey: 'total' }
            ];

            const tableRows = invoice.items.map((item) => {
                return {
                    item: item.itemName || 'N/A',
                    qty: item.qty || 0,
                    price: (item.price || 0).toFixed(2),
                    total: (item.total || ((item.qty || 0) * (item.price || 0))).toFixed(2)
                };
            });

            // Make sure there are empty rows
            const emptyRowsCount = Math.max(0, 10 - tableRows.length);
            for(let i=0; i<emptyRowsCount; i++){
                tableRows.push({
                    item: ' ',
                    qty: ' ',
                    price: ' ',
                    total: ' '
                });
            }

            doc.autoTable({
                columns: tableColumns,
                body: tableRows,
                startY: y,
                theme: 'plain',
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontSize: 9,
                    fontStyle: 'bold',
                    cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
                    lineWidth: 0.5,
                    lineColor: [0, 0, 0],
                    halign: 'center'
                },
                columnStyles: {
                    item: { cellWidth: 80, halign: 'left', lineWidth: {left: 0.5, right: 0.5} },
                    qty: { cellWidth: 30, halign: 'center', lineWidth: {left: 0.5, right: 0.5} },
                    price: { cellWidth: 30, halign: 'right', lineWidth: {left: 0.5, right: 0.5} },
                    total: { cellWidth: 30, halign: 'right', lineWidth: {left: 0.5, right: 0.5} }
                },
                bodyStyles: {
                    fontSize: 9,
                    cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
                    textColor: [0, 0, 0],
                },
                styles: { font: 'helvetica' },
                margin: { left: margin, right: margin }
            });

            // Draw line to close table
            let finalY = doc.lastAutoTable.finalY;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(margin, finalY, rightEdge, finalY);

            // --- TOTALS BLOCK ---
            finalY += 4;
            const totalsBoxX = rightEdge - 50; 
            const valBoxX = rightEdge;

            // SUBTOTAL
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text('SUBTOTAL', totalsBoxX, finalY + 6, { align: 'right' });
            doc.setFont("helvetica", "normal");
            doc.text((invoice.subTotal || 0).toFixed(2), valBoxX, finalY + 6, { align: 'right' });
            
            // Bottom rule for subtotal
            doc.setLineWidth(0.1);
            doc.line(rightEdge - 60, finalY + 8, rightEdge, finalY + 8);
            finalY += 8;

            // SALES TAX
            const taxAmount = (invoice.grandTotal || 0) - (invoice.subTotal || 0);
            doc.setFont("helvetica", "bold");
            doc.text('SALES TAX', totalsBoxX, finalY + 6, { align: 'right' });
            doc.setFont("helvetica", "normal");
            doc.text(taxAmount.toFixed(2), valBoxX, finalY + 6, { align: 'right' });
            
            doc.setLineWidth(0.1);
            doc.line(rightEdge - 60, finalY + 8, rightEdge, finalY + 8);
            finalY += 8;

            // TOTAL DUE
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text('TOTAL DUE', totalsBoxX, finalY + 6, { align: 'right' });
            doc.text(`Rs. ${(invoice.grandTotal || 0).toFixed(2)}`, valBoxX, finalY + 6, { align: 'right' });
            
            doc.setLineWidth(0.5);
            doc.line(rightEdge - 60, finalY + 8, rightEdge, finalY + 8);

            // --- ADDITIONAL INFO ---
            const infoY = finalY + 25;
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text('Additional Information/Comments:', margin, infoY);

            doc.setLineWidth(0.5);
            // Draw Box
            doc.rect(margin, infoY + 3, pageWidth - (margin*2), 25);
            
            doc.setFont("helvetica", "normal");
            doc.text('Thank you for your business! Payment is due within 30 days unless otherwise agreed.', margin + 4, infoY + 12);
            doc.setFont("helvetica", "italic");
            doc.text('This is an auto-generated invoice securely provided by BizzOps Platform.', margin + 4, infoY + 20);

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