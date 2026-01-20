import React, { useEffect, useState } from "react";
import Layout from "../Layout";
import axios from "axios";
import {
    TrendingUp, DollarSign, Package, Users, Building2,
    ShoppingCart, Handshake, Calendar, UserCog, FileText,
    Box, BarChart3, Wallet, TrendingDown, AlertCircle
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line } from "recharts";

// Import components
import KPICard from "./KPICard";
import StatCard from "./StatCard";
import ChartCard from "./ChartCard";
import HealthScoreGauge from "./HealthScoreGauge";
import InsightsPanel from "./InsightsPanel";
import DateRangeSelector from "./DateRangeSelector";
import ExportButton from "./ExportButton";
import {
    InventoryHealthChart,
    CustomerSegmentationChart,
    VendorPerformanceChart,
    OrderFulfillmentChart,
    DealsPipelineChart,
    TaskCompletionChart,
    StaffPerformanceRadarChart,
    InvoiceStatusChart,
    ProductPerformanceTrend
} from "./DashboardCharts";

function Dashboard() {
    const [dateRange, setDateRange] = useState('month');
    const [loading, setLoading] = useState(true);

    // State for all dashboard data
    const [businessHealth, setBusinessHealth] = useState(null);
    const [salesAnalytics, setSalesAnalytics] = useState(null);
    const [financialPerformance, setFinancialPerformance] = useState(null);
    const [inventoryInsights, setInventoryInsights] = useState(null);
    const [customerIntelligence, setCustomerIntelligence] = useState(null);
    const [vendorPerformance, setVendorPerformance] = useState(null);
    const [orderFulfillment, setOrderFulfillment] = useState(null);
    const [dealsPipeline, setDealsPipeline] = useState(null);
    const [appointmentsTasks, setAppointmentsTasks] = useState(null);
    const [staffPerformance, setStaffPerformance] = useState(null);
    const [invoiceManagement, setInvoiceManagement] = useState(null);
    const [productAnalytics, setProductAnalytics] = useState(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const baseURL = import.meta.env.VITE_BACKEND_URL;
            const config = { withCredentials: true, params: { range: dateRange } };

            const [
                healthRes,
                salesRes,
                financialRes,
                inventoryRes,
                customerRes,
                vendorRes,
                orderRes,
                dealsRes,
                appointmentsRes,
                staffRes,
                invoiceRes,
                productRes
            ] = await Promise.all([
                axios.get(`${baseURL}/api/v1/dashboard/business-health`, config),
                axios.get(`${baseURL}/api/v1/dashboard/sales-analytics`, config),
                axios.get(`${baseURL}/api/v1/dashboard/financial-performance`, config),
                axios.get(`${baseURL}/api/v1/dashboard/inventory-insights`, config),
                axios.get(`${baseURL}/api/v1/dashboard/customer-intelligence`, config),
                axios.get(`${baseURL}/api/v1/dashboard/vendor-performance`, config),
                axios.get(`${baseURL}/api/v1/dashboard/order-fulfillment`, config),
                axios.get(`${baseURL}/api/v1/dashboard/deals-pipeline`, config),
                axios.get(`${baseURL}/api/v1/dashboard/appointments-tasks`, config),
                axios.get(`${baseURL}/api/v1/dashboard/staff-performance`, config),
                axios.get(`${baseURL}/api/v1/dashboard/invoice-management`, config),
                axios.get(`${baseURL}/api/v1/dashboard/product-analytics`, config)
            ]);

            setBusinessHealth(healthRes.data.data);
            setSalesAnalytics(salesRes.data.data);
            setFinancialPerformance(financialRes.data.data);
            setInventoryInsights(inventoryRes.data.data);
            setCustomerIntelligence(customerRes.data.data);
            setVendorPerformance(vendorRes.data.data);
            setOrderFulfillment(orderRes.data.data);
            setDealsPipeline(dealsRes.data.data);
            setAppointmentsTasks(appointmentsRes.data.data);
            setStaffPerformance(staffRes.data.data);
            setInvoiceManagement(invoiceRes.data.data);
            setProductAnalytics(productRes.data.data);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const handleExportPDF = () => {
        console.log("Exporting to PDF...");
        // TODO: Implement PDF export
    };

    const handleExportExcel = () => {
        console.log("Exporting to Excel...");
        // TODO: Implement Excel export
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <div className="flex items-center gap-3">
                            <DateRangeSelector value={dateRange} onChange={setDateRange} />
                            <ExportButton onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">
                        Last updated: {new Date().toLocaleString()}
                    </p>
                </div>

                {/* Business Health Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-1">
                        {businessHealth && (
                            <HealthScoreGauge
                                score={businessHealth.healthScore}
                                status={businessHealth.status}
                                color={businessHealth.color}
                            />
                        )}
                    </div>
                    <div className="lg:col-span-2">
                        <InsightsPanel />
                    </div>
                </div>

                {/* Section 1: Sales Analytics */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="text-blue-600" size={24} />
                        Sales Analytics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <KPICard
                            title="Total Sales"
                            value={salesAnalytics ? `₹${salesAnalytics.totalSales.toLocaleString()}` : '₹0'}
                            subtitle="All time revenue"
                            trend="up"
                            trendValue={salesAnalytics?.salesGrowth || 0}
                            sparklineData={salesAnalytics?.sparklineData || []}
                            icon={<DollarSign size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="Monthly Sales"
                            value={salesAnalytics ? `₹${salesAnalytics.monthlySales.toLocaleString()}` : '₹0'}
                            subtitle="Last 30 days"
                            trend={salesAnalytics?.monthlyGrowth >= 0 ? 'up' : 'down'}
                            trendValue={salesAnalytics?.monthlyGrowth || 0}
                            sparklineData={salesAnalytics?.monthlySparklineData || []}
                            icon={<TrendingUp size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="Daily Sales"
                            value={salesAnalytics ? `₹${salesAnalytics.dailySales.toLocaleString()}` : '₹0'}
                            subtitle="Today's revenue"
                            trend={salesAnalytics?.dailyGrowth >= 0 ? 'up' : 'down'}
                            trendValue={salesAnalytics?.dailyGrowth || 0}
                            sparklineData={salesAnalytics?.dailySparklineData || []}
                            icon={<DollarSign size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="Sales Growth"
                            value={salesAnalytics ? `${salesAnalytics.salesGrowth.toFixed(1)}%` : '0%'}
                            subtitle="vs previous period"
                            trend={salesAnalytics?.salesGrowth >= 0 ? 'up' : 'down'}
                            trendValue={salesAnalytics?.salesGrowth || 0}
                            icon={salesAnalytics?.salesGrowth >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            loading={loading}
                        />
                    </div>
                    {salesAnalytics && (
                        <ChartCard title="Sales & Profit Trend">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={salesAnalytics.sparklineData.map((val, idx) => ({
                                    day: `Day ${idx + 1}`,
                                    sales: val,
                                    profit: val * 0.3
                                }))}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="day" stroke="#6B7280" />
                                    <YAxis stroke="#6B7280" />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="sales" stroke="#3B82F6" fillOpacity={1} fill="url(#colorSales)" />
                                    <Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    )}
                </div>

                {/* Section 2: Financial Performance */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Wallet className="text-green-600" size={24} />
                        Financial Performance
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <KPICard
                            title="Total Profit"
                            value={financialPerformance ? `₹${financialPerformance.totalProfit.toLocaleString()}` : '₹0'}
                            subtitle="Net earnings"
                            icon={<DollarSign size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="Gross Profit Margin"
                            value={financialPerformance ? `${financialPerformance.grossProfitMargin.toFixed(1)}%` : '0%'}
                            subtitle="Profit percentage"
                            icon={<TrendingUp size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="Net Profit Margin"
                            value={financialPerformance ? `${financialPerformance.netProfitMargin.toFixed(1)}%` : '0%'}
                            subtitle="After expenses"
                            icon={<TrendingUp size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="Total Expenses"
                            value={financialPerformance ? `₹${financialPerformance.totalExpenses.toLocaleString()}` : '₹0'}
                            subtitle="Operating costs"
                            icon={<DollarSign size={18} />}
                            loading={loading}
                        />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {financialPerformance && (
                            <>
                                <ChartCard title="Revenue vs Profit">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={[
                                            { name: 'Revenue', value: financialPerformance.totalRevenue },
                                            { name: 'Cost', value: financialPerformance.totalCost },
                                            { name: 'Profit', value: financialPerformance.totalProfit },
                                            { name: 'Expenses', value: financialPerformance.totalExpenses }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis dataKey="name" stroke="#6B7280" />
                                            <YAxis stroke="#6B7280" />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                                <ChartCard title="Expense Breakdown">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={financialPerformance.expenseBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => entry._id}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="amount"
                                            >
                                                {financialPerformance.expenseBreakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </>
                        )}
                    </div>
                </div>

                {/* Section 3: Inventory Management */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="text-purple-600" size={24} />
                        Inventory Management
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            title="Total Stock Value"
                            value={inventoryInsights ? `₹${inventoryInsights.totalStockValue.toLocaleString()}` : '₹0'}
                            subtitle="Current inventory worth"
                            icon={<Package size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="Low Stock Items"
                            value={inventoryInsights?.lowStockItems || 0}
                            subtitle="Needs attention"
                            icon={<AlertCircle size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="Inventory Turnover"
                            value={inventoryInsights?.inventoryTurnover || '0'}
                            subtitle="Times per period"
                            icon={<TrendingUp size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="Reorder Needed"
                            value={inventoryInsights?.reorderNeeded || 0}
                            subtitle="Items to restock"
                            icon={<ShoppingCart size={18} />}
                            loading={loading}
                        />
                    </div>
                    <div className="mt-4">
                        <InventoryHealthChart inventoryInsights={inventoryInsights} />
                    </div>
                </div>

                {/* Section 4: Customer Intelligence */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="text-blue-600" size={24} />
                        Customer Intelligence
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            title="Total Customers"
                            value={customerIntelligence?.totalCustomers || 0}
                            subtitle="Active customer base"
                            icon={<Users size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="New Customers"
                            value={customerIntelligence?.newCustomers || 0}
                            subtitle="This period"
                            icon={<Users size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="Customer Lifetime Value"
                            value={customerIntelligence ? `₹${customerIntelligence.customerLifetimeValue.toLocaleString()}` : '₹0'}
                            subtitle="Average per customer"
                            icon={<DollarSign size={18} />}
                            loading={loading}
                        />
                        <KPICard
                            title="Retention Rate"
                            value={customerIntelligence ? `${customerIntelligence.retentionRate.toFixed(1)}%` : '0%'}
                            subtitle="Customer loyalty"
                            icon={<TrendingUp size={18} />}
                            loading={loading}
                        />
                    </div>
                    <div className="mt-4">
                        <CustomerSegmentationChart customerIntelligence={customerIntelligence} />
                    </div>
                </div>

                {/* Section 5: Vendor Performance */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="text-indigo-600" size={24} />
                        Vendor Performance
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Vendors"
                            value={vendorPerformance?.totalVendors || 0}
                            icon={<Building2 size={20} />}
                            color="#6366F1"
                            loading={loading}
                        />
                        <StatCard
                            title="Active Vendors"
                            value={vendorPerformance?.activeVendors || 0}
                            icon={<Building2 size={20} />}
                            color="#10B981"
                            loading={loading}
                        />
                        <StatCard
                            title="Avg Payment Time"
                            value={`${vendorPerformance?.avgPaymentTime || 0} days`}
                            icon={<Calendar size={20} />}
                            color="#F59E0B"
                            loading={loading}
                        />
                        <StatCard
                            title="Vendor Rating"
                            value={vendorPerformance?.vendorRating || '0.0'}
                            icon={<TrendingUp size={20} />}
                            color="#3B82F6"
                            loading={loading}
                        />
                    </div>
                    <div className="mt-4">
                        <VendorPerformanceChart vendorPerformance={vendorPerformance} />
                    </div>
                </div>

                {/* Section 6: Order Fulfillment */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingCart className="text-orange-600" size={24} />
                        Order Fulfillment
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Orders"
                            value={orderFulfillment?.totalOrders || 0}
                            icon={<ShoppingCart size={20} />}
                            color="#F97316"
                            loading={loading}
                        />
                        <StatCard
                            title="Pending Orders"
                            value={orderFulfillment?.pendingOrders || 0}
                            icon={<AlertCircle size={20} />}
                            color="#EF4444"
                            loading={loading}
                        />
                        <StatCard
                            title="Fulfilled Orders"
                            value={orderFulfillment?.fulfilledOrders || 0}
                            icon={<ShoppingCart size={20} />}
                            color="#10B981"
                            loading={loading}
                        />
                        <StatCard
                            title="Avg Fulfillment Time"
                            value={`${orderFulfillment?.avgFulfillmentTime || 0} days`}
                            icon={<Calendar size={20} />}
                            color="#3B82F6"
                            loading={loading}
                        />
                    </div>
                    <div className="mt-4">
                        <OrderFulfillmentChart orderFulfillment={orderFulfillment} />
                    </div>
                </div>

                {/* Section 7: Deals Pipeline */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Handshake className="text-teal-600" size={24} />
                        Deals Pipeline
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Deals"
                            value={dealsPipeline?.totalDeals || 0}
                            icon={<Handshake size={20} />}
                            color="#14B8A6"
                            loading={loading}
                        />
                        <StatCard
                            title="Deal Value"
                            value={dealsPipeline ? `₹${dealsPipeline.dealValue.toLocaleString()}` : '₹0'}
                            icon={<DollarSign size={20} />}
                            color="#10B981"
                            loading={loading}
                        />
                        <StatCard
                            title="Conversion Rate"
                            value={dealsPipeline ? `${dealsPipeline.conversionRate.toFixed(1)}%` : '0%'}
                            icon={<TrendingUp size={20} />}
                            color="#3B82F6"
                            loading={loading}
                        />
                        <StatCard
                            title="Avg Deal Size"
                            value={dealsPipeline ? `₹${dealsPipeline.avgDealSize.toLocaleString()}` : '₹0'}
                            icon={<DollarSign size={20} />}
                            color="#8B5CF6"
                            loading={loading}
                        />
                    </div>
                    <div className="mt-4">
                        <DealsPipelineChart dealsPipeline={dealsPipeline} />
                    </div>
                </div>

                {/* Section 8: Appointments & Tasks */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="text-pink-600" size={24} />
                        Appointments & Tasks
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Appointments"
                            value={appointmentsTasks?.totalAppointments || 0}
                            icon={<Calendar size={20} />}
                            color="#EC4899"
                            loading={loading}
                        />
                        <StatCard
                            title="Completed Tasks"
                            value={appointmentsTasks?.completedTasks || 0}
                            icon={<TrendingUp size={20} />}
                            color="#10B981"
                            loading={loading}
                        />
                        <StatCard
                            title="Pending Tasks"
                            value={appointmentsTasks?.pendingTasks || 0}
                            icon={<AlertCircle size={20} />}
                            color="#F59E0B"
                            loading={loading}
                        />
                        <StatCard
                            title="Task Completion Rate"
                            value={appointmentsTasks ? `${appointmentsTasks.taskCompletionRate.toFixed(1)}%` : '0%'}
                            icon={<TrendingUp size={20} />}
                            color="#3B82F6"
                            loading={loading}
                        />
                    </div>
                    <div className="mt-4">
                        <TaskCompletionChart appointmentsTasks={appointmentsTasks} />
                    </div>
                </div>

                {/* Section 9: Staff Performance */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <UserCog className="text-cyan-600" size={24} />
                        Staff Performance
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Staff"
                            value={staffPerformance?.totalStaff || 0}
                            icon={<UserCog size={20} />}
                            color="#06B6D4"
                            loading={loading}
                        />
                        <StatCard
                            title="Active Staff"
                            value={staffPerformance?.activeStaff || 0}
                            icon={<UserCog size={20} />}
                            color="#10B981"
                            loading={loading}
                        />
                        <StatCard
                            title="Avg Sales per Staff"
                            value={staffPerformance ? `₹${staffPerformance.avgSalesPerStaff.toLocaleString()}` : '₹0'}
                            icon={<DollarSign size={20} />}
                            color="#3B82F6"
                            loading={loading}
                        />
                        <StatCard
                            title="Productivity Score"
                            value={staffPerformance?.productivityScore || 0}
                            icon={<TrendingUp size={20} />}
                            color="#8B5CF6"
                            loading={loading}
                        />
                    </div>
                    <div className="mt-4">
                        <StaffPerformanceRadarChart staffPerformance={staffPerformance} />
                    </div>
                </div>

                {/* Section 10: Invoice Management */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="text-amber-600" size={24} />
                        Invoice Management
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Invoices"
                            value={invoiceManagement?.totalInvoices || 0}
                            icon={<FileText size={20} />}
                            color="#F59E0B"
                            loading={loading}
                        />
                        <StatCard
                            title="Paid Invoices"
                            value={invoiceManagement?.paidInvoices || 0}
                            icon={<FileText size={20} />}
                            color="#10B981"
                            loading={loading}
                        />
                        <StatCard
                            title="Unpaid Amount"
                            value={invoiceManagement ? `₹${invoiceManagement.unpaidAmount.toLocaleString()}` : '₹0'}
                            icon={<DollarSign size={20} />}
                            color="#EF4444"
                            loading={loading}
                        />
                        <StatCard
                            title="Avg Payment Days"
                            value={`${invoiceManagement?.avgPaymentDays || 0} days`}
                            icon={<Calendar size={20} />}
                            color="#3B82F6"
                            loading={loading}
                        />
                    </div>
                    <div className="mt-4">
                        <InvoiceStatusChart invoiceManagement={invoiceManagement} />
                    </div>
                </div>

                {/* Section 11: Product Analytics */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Box className="text-rose-600" size={24} />
                        Product Analytics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <StatCard
                            title="Total Products"
                            value={productAnalytics?.totalProducts || 0}
                            icon={<Box size={20} />}
                            color="#F43F5E"
                            loading={loading}
                        />
                        <StatCard
                            title="Product Margin"
                            value={productAnalytics ? `${productAnalytics.productMargin.toFixed(1)}%` : '0%'}
                            icon={<TrendingUp size={20} />}
                            color="#10B981"
                            loading={loading}
                        />
                        <StatCard
                            title="Stock Turnover"
                            value={productAnalytics?.stockTurnover || '0'}
                            icon={<TrendingUp size={20} />}
                            color="#3B82F6"
                            loading={loading}
                        />
                        <StatCard
                            title="Best Sellers"
                            value={productAnalytics?.bestSellers?.length || 0}
                            icon={<TrendingUp size={20} />}
                            color="#8B5CF6"
                            loading={loading}
                        />
                    </div>
                    <div className="mt-4">
                        <ProductPerformanceTrend productAnalytics={productAnalytics} />
                    </div>
                    {productAnalytics?.bestSellers && productAnalytics.bestSellers.length > 0 && (
                        <ChartCard title="Top Performing Products" className="mt-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity Sold</th>
                                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Profit</th>
                                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productAnalytics.bestSellers.map((product, index) => (
                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium text-gray-900">{product.productName}</td>
                                                <td className="py-3 px-4 text-right text-gray-700">{product.totalQty}</td>
                                                <td className="py-3 px-4 text-right text-gray-700">₹{product.totalRevenue.toLocaleString()}</td>
                                                <td className="py-3 px-4 text-right text-green-600">₹{product.totalProfit.toLocaleString()}</td>
                                                <td className="py-3 px-4 text-right text-blue-600">{product.profitMargin.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default Dashboard;