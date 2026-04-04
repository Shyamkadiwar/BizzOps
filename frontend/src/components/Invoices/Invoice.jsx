import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Box, Typography, Chip, IconButton } from '@mui/material';
import { Download, Search, X, FileText, CheckCircle, Clock, IndianRupee } from 'lucide-react';
import Layout from "../Layout.jsx";
import ProfessionalDataGrid from "../shared/ProfessionalDataGrid.jsx";

const token = localStorage.getItem('accessToken');

function Invoice() {
    const [allInvoices, setAllInvoices] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'paid' | 'unpaid'
    const [monthFilter, setMonthFilter] = useState('all');

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/get-invoice?limit=5000`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );

            if (response.status === 200 && response.data && response.data.data) {
                const invoicesData = response.data.data.invoices || [];
                const data = invoicesData.map(invoice => ({ ...invoice, id: invoice._id }));
                setAllInvoices(data);
                setInvoices(data);
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

    // Derive months for dropdown (Format: 'YYYY-MM')
    const months = useMemo(() => {
        const uniqueMonths = [...new Set(allInvoices.map(i => {
            if (!i.date) return null;
            const d = new Date(i.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }).filter(Boolean))].sort((a,b) => b.localeCompare(a)); // Descending
        return uniqueMonths;
    }, [allInvoices]);

    // Apply filters instantly
    useEffect(() => {
        let filtered = [...allInvoices];

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(i =>
                i.customerName?.toLowerCase().includes(q) ||
                i.invoiceNumber?.toString().includes(q) ||
                i.items?.some(item => item.itemName?.toLowerCase().includes(q))
            );
        }

        if (statusFilter === 'paid') filtered = filtered.filter(i => i.paid);
        else if (statusFilter === 'unpaid') filtered = filtered.filter(i => !i.paid);

        if (monthFilter !== 'all') {
            filtered = filtered.filter(i => {
                if (!i.date) return false;
                const d = new Date(i.date);
                const itemMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return itemMonth === monthFilter;
            });
        }

        setInvoices(filtered);
    }, [search, statusFilter, monthFilter, allInvoices]);

    // Stats
    const stats = useMemo(() => {
        const paidInvoices = invoices.filter(i => i.paid);
        const unpaidInvoices = invoices.filter(i => !i.paid);
        
        return {
            total: allInvoices.length,
            filtered: invoices.length,
            totalPaidAmount: paidInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0),
            totalUnpaidAmount: unpaidInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0),
            paidCount: paidInvoices.length,
            unpaidCount: unpaidInvoices.length
        };
    }, [invoices, allInvoices]);

    const clearFilters = () => { setSearch(''); setStatusFilter('all'); setMonthFilter('all'); };
    const hasActiveFilter = search || statusFilter !== 'all' || monthFilter !== 'all';

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
            const invoice = allInvoices.find(inv => inv._id === invoiceId);
            if (!invoice || !invoice.items) {
                alert('Invoice data not found');
                return;
            }

            let userDetails = {};
            try {
                const userRes = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/get-details`,
                    { headers: { 'Authorization': token }, withCredentials: true }
                );
                if (userRes.data.statusCode === 200) userDetails = userRes.data.data;
            } catch (e) {
                console.warn('Could not fetch user details');
            }

            const { default: jsPDF } = await import('jspdf');
            await import('jspdf-autotable');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const rightEdge = pageWidth - margin;

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

            let y = margin;
            
            if (logoBase64) {
                doc.addImage(logoBase64, 'JPEG', margin, y, 25, 25);
                y += 30;
            } else {
                y += 5;
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.text(userDetails.businessName || 'Business Name', margin, y);
            
            doc.setFontSize(28);
            doc.text('INVOICE', rightEdge, y, { align: 'right' });
            
            y += 8;
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            
            let businessDetailsLeftY = y;
            if (userDetails.address) { doc.text(userDetails.address, margin, businessDetailsLeftY); businessDetailsLeftY += 5; }
            if (userDetails.phoneNo) { doc.text(`Phone: ${userDetails.phoneNo}`, margin, businessDetailsLeftY); businessDetailsLeftY += 5; }
            if (userDetails.email) { doc.text(`Email: ${userDetails.email}`, margin, businessDetailsLeftY); businessDetailsLeftY += 5; }
            if (userDetails.website) { doc.text(`${userDetails.website}`, margin, businessDetailsLeftY); businessDetailsLeftY += 5; }
            if (userDetails.gstNumber) { doc.text(`GST No: ${userDetails.gstNumber}`, margin, businessDetailsLeftY); businessDetailsLeftY += 5; }

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
            const formattedDate = new Date(invoice.date || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
            doc.text(formattedDate, rightEdge, metaY, { align: 'right' });

            metaY += 6;
            doc.setFont("helvetica", "bold");
            doc.text('STATUS:', metaLabelX, metaY, { align: 'right' });
            doc.setTextColor(invoice.paid ? 34 : 200, invoice.paid ? 139 : 30, invoice.paid ? 34 : 30);
            doc.text(invoice.paid ? 'PAID' : 'UNPAID', rightEdge, metaY, { align: 'right' });
            doc.setTextColor(0, 0, 0);

            y = Math.max(businessDetailsLeftY, metaY) + 15;

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

            const tableColumns = [
                { header: 'DESCRIPTION', dataKey: 'item' },
                { header: 'QUANTITY', dataKey: 'qty' },
                { header: 'UNIT PRICE', dataKey: 'price' },
                { header: 'TOTAL', dataKey: 'total' }
            ];

            const tableRows = invoice.items.map((item) => ({
                item: item.itemName || 'N/A',
                qty: item.qty || 0,
                price: (item.price || 0).toFixed(2),
                total: (item.total || ((item.qty || 0) * (item.price || 0))).toFixed(2)
            }));

            const emptyRowsCount = Math.max(0, 10 - tableRows.length);
            for(let i=0; i<emptyRowsCount; i++){
                tableRows.push({ item: ' ', qty: ' ', price: ' ', total: ' ' });
            }

            doc.autoTable({
                columns: tableColumns,
                body: tableRows,
                startY: y,
                theme: 'plain',
                headStyles: {
                    fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 9, fontStyle: 'bold',
                    cellPadding: { top: 6, bottom: 6, left: 4, right: 4 }, lineWidth: 0.5, lineColor: [0, 0, 0], halign: 'center'
                },
                columnStyles: {
                    item: { cellWidth: 80, halign: 'left', lineWidth: {left: 0.5, right: 0.5} },
                    qty: { cellWidth: 30, halign: 'center', lineWidth: {left: 0.5, right: 0.5} },
                    price: { cellWidth: 30, halign: 'right', lineWidth: {left: 0.5, right: 0.5} },
                    total: { cellWidth: 30, halign: 'right', lineWidth: {left: 0.5, right: 0.5} }
                },
                bodyStyles: { fontSize: 9, cellPadding: { top: 5, bottom: 5, left: 4, right: 4 }, textColor: [0, 0, 0] },
                styles: { font: 'helvetica' },
                margin: { left: margin, right: margin }
            });

            let finalY = doc.lastAutoTable.finalY;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(margin, finalY, rightEdge, finalY);

            finalY += 4;
            const totalsBoxX = rightEdge - 50; 
            const valBoxX = rightEdge;

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text('SUBTOTAL', totalsBoxX, finalY + 6, { align: 'right' });
            doc.setFont("helvetica", "normal");
            doc.text((invoice.subTotal || 0).toFixed(2), valBoxX, finalY + 6, { align: 'right' });
            
            doc.setLineWidth(0.1);
            doc.line(rightEdge - 60, finalY + 8, rightEdge, finalY + 8);
            finalY += 8;

            const taxAmount = (invoice.grandTotal || 0) - (invoice.subTotal || 0);
            doc.setFont("helvetica", "bold");
            doc.text('SALES TAX', totalsBoxX, finalY + 6, { align: 'right' });
            doc.setFont("helvetica", "normal");
            doc.text(taxAmount.toFixed(2), valBoxX, finalY + 6, { align: 'right' });
            
            doc.setLineWidth(0.1);
            doc.line(rightEdge - 60, finalY + 8, rightEdge, finalY + 8);
            finalY += 8;

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text('TOTAL DUE', totalsBoxX, finalY + 6, { align: 'right' });
            doc.text(`Rs. ${(invoice.grandTotal || 0).toFixed(2)}`, valBoxX, finalY + 6, { align: 'right' });
            
            doc.setLineWidth(0.5);
            doc.line(rightEdge - 60, finalY + 8, rightEdge, finalY + 8);

            const infoY = finalY + 25;
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text('Additional Information/Comments:', margin, infoY);

            doc.setLineWidth(0.5);
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
                { headers: { 'Authorization': token }, withCredentials: true, responseType: 'blob' }
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
            field: 'date', headerName: 'Date', width: 120,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
        },
        { field: 'customerName', headerName: 'Customer', width: 180 },
        {
            field: 'items', headerName: 'Items', width: 220,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {params.value?.map((item, idx) => (
                        <Chip key={idx} label={`${item.itemName} (${item.qty})`} size="small" variant="outlined" />
                    ))}
                </Box>
            )
        },
        {
            field: 'subTotal', headerName: 'Sub Total', width: 120, type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`
        },
        {
            field: 'grandTotal', headerName: 'Grand Total', width: 130, type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`,
            cellClassName: 'font-bold text-blue-600'
        },
        {
            field: 'paid', headerName: 'Status', width: 120,
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
            field: 'actions', headerName: 'Actions', width: 100, sortable: false, filterable: false,
            renderCell: (params) => (
                <IconButton size="small" onClick={() => handleDownloadInvoice(params.row._id)} color="primary">
                    <Download size={16} />
                </IconButton>
            )
        }
    ];

    const formatMonth = (m) => {
        const [year, month] = m.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <div>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                            Invoice Management
                        </Typography>
                        <p className="text-sm text-gray-500 mt-0.5">Invoices are automatically created from sales. Click on status to toggle paid/unpaid.</p>
                    </div>
                    <button onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                        <Download size={16} /> Export
                    </button>
                </Box>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoices</span>
                            <FileText size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.filtered}</p>
                        <p className="text-xs text-gray-400 mt-0.5">of {stats.total} total</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paid Revenue</span>
                            <CheckCircle size={16} className="text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.totalPaidAmount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stats.paidCount} paid invoices</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Dues</span>
                            <Clock size={16} className="text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.totalUnpaidAmount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stats.unpaidCount} unpaid invoices</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gross Value</span>
                            <IndianRupee size={16} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{(stats.totalPaidAmount + stats.totalUnpaidAmount).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">generated total</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-52">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search customer, item, invoice number..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X size={14} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'paid', label: 'Paid' },
                            { key: 'unpaid', label: 'Unpaid' },
                        ].map(opt => (
                            <button key={opt.key} onClick={() => setStatusFilter(opt.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === opt.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Month Dropdown */}
                    <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 font-medium">
                        <option value="all">All Time</option>
                        {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
                    </select>

                    {hasActiveFilter && (
                        <button onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                            <X size={13} /> Clear
                        </button>
                    )}

                    <span className="text-xs text-gray-400 ml-auto font-medium">{invoices.length} invoices</span>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md overflow-hidden">
                    <Box sx={{ height: 560, width: '100%' }}>
                        <ProfessionalDataGrid
                            rows={invoices}
                            columns={columns}
                            loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </div>
            </div>
        </Layout>
    );
}

export default Invoice;