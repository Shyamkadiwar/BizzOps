import React, { useState } from "react";
import {
    TrendingUp, DollarSign, Package, Users, Building2,
    ShoppingCart, Handshake, Calendar, UserCog, FileText,
    Box, BarChart3, Wallet, TrendingDown, AlertCircle
} from "lucide-react";

import {
    Dashboard as DashboardIcon,
    Inventory as InventoryIcon,
    ShoppingCart as ShoppingCartIcon,
    LocalOffer as DealsIcon,
    Assignment as TaskIcon,
    Assessment as ReportIcon,
    AttachMoney as ExpenseIcon,
    ShoppingBag as OrdersIcon,
    Payment as PaymentIcon,
    Group as StaffIcon,
    Menu as MenuIcon,
    Notifications as NotificationsIcon
} from "@mui/icons-material";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import logo from '../assets/logo.png';

import KPICard from "./Dashboard/KPICard";
import StatCard from "./Dashboard/StatCard";
import ChartCard from "./Dashboard/ChartCard";
import HealthScoreGauge from "./Dashboard/HealthScoreGauge";
import InsightsPanel from "./Dashboard/InsightsPanel";
import DateRangeSelector from "./Dashboard/DateRangeSelector";
import ExportButton from "./Dashboard/ExportButton";
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
} from "./Dashboard/DashboardCharts";

// Dummy Sidebar Items
const sidebarItems = [
    { icon: <DashboardIcon size={24} />, active: true },
    { icon: <InventoryIcon size={24} /> },
    { icon: <ShoppingCartIcon size={24} /> },
    { icon: <DealsIcon size={24} /> },
    { icon: <TaskIcon size={24} /> },
    { icon: <ReportIcon size={24} /> },
    { icon: <ExpenseIcon size={24} /> },
    { icon: <OrdersIcon size={24} /> },
    { icon: <PaymentIcon size={24} /> },
    { icon: <StaffIcon size={24} /> },
];

function DummyDashboard() {
    const [dateRange, setDateRange] = useState('month');

    // DUMMY DATA FOR DASHBOARD
    const businessHealth = { healthScore: 85, status: "Excellent", color: "#10B981" };
    const salesAnalytics = {
        totalSales: 1250000,
        monthlySales: 154000,
        dailySales: 5400,
        salesGrowth: 12.5,
        sparklineData: [4000, 5000, 4500, 6000, 5500, 7000, 8000],
        monthlySparklineData: [120000, 130000, 125000, 140000, 135000, 154000],
        dailySparklineData: [4500, 4800, 5100, 5200, 5000, 5300, 5400]
    };
    const financialPerformance = {
        totalProfit: 450000,
        grossProfitMargin: 42.5,
        netProfitMargin: 36.0,
        totalExpenses: 280000,
        totalRevenue: 1250000,
        totalCost: 520000,
        expenseBreakdown: [
            { _id: 'Marketing', amount: 80000 },
            { _id: 'Operations', amount: 100000 },
            { _id: 'Rent', amount: 50000 },
            { _id: 'Software', amount: 20000 },
            { _id: 'Misc', amount: 30000 },
        ]
    };
    const inventoryInsights = {
        totalStockValue: 850000,
        lowStockItems: 12,
        inventoryTurnover: '4.5',
        reorderNeeded: 8,
        statusCounts: { 'In Stock': 450, 'Low Stock': 12, 'Out of Stock': 4 }
    };
    const customerIntelligence = {
        totalCustomers: 1250,
        newCustomers: 45,
        customerLifetimeValue: 8500,
        retentionRate: 85.5,
        distribution: { 'Retail': 800, 'Wholesale': 450 }
    };
    const vendorPerformance = {
        totalVendors: 45,
        activeVendors: 38,
        avgPaymentTime: 12,
        vendorRating: '4.8',
        performanceData: [
            { name: 'Vendor A', deliveryTime: 2, qualityScore: 9.5, communication: 9 },
            { name: 'Vendor B', deliveryTime: 3, qualityScore: 8.5, communication: 8 },
            { name: 'Vendor C', deliveryTime: 1, qualityScore: 9.8, communication: 9.5 }
        ]
    };
    const orderFulfillment = {
        totalOrders: 850,
        pendingOrders: 24,
        fulfilledOrders: 815,
        avgFulfillmentTime: 2.5,
        statusCounts: { 'Pending': 24, 'Processing': 11, 'Shipped': 815 }
    };
    const dealsPipeline = {
        totalDeals: 45,
        dealValue: 2500000,
        conversionRate: 24.5,
        avgDealSize: 55000,
        pipelineStages: { 'Lead': 15, 'Negotiation': 12, 'Proposal': 10, 'Won': 8 }
    };
    const appointmentsTasks = {
        totalAppointments: 124,
        completedTasks: 85,
        pendingTasks: 12,
        taskCompletionRate: 87.6,
        timelineData: [
            { date: 'Mon', tasks: 15, appointments: 8 },
            { date: 'Tue', tasks: 12, appointments: 10 },
            { date: 'Wed', tasks: 18, appointments: 12 }
        ]
    };
    const staffPerformance = {
        totalStaff: 24,
        activeStaff: 22,
        avgSalesPerStaff: 145000,
        productivityScore: 88,
        radarData: [
            { subject: 'Sales', A: 120, fullMark: 150 },
            { subject: 'Customer Service', A: 98, fullMark: 150 },
            { subject: 'Efficiency', A: 86, fullMark: 150 },
            { subject: 'Knowledge', A: 99, fullMark: 150 }
        ]
    };
    const invoiceManagement = {
        totalInvoices: 450,
        paidInvoices: 412,
        unpaidAmount: 85000,
        avgPaymentDays: 14,
        statusCounts: { 'Paid': 412, 'Unpaid': 28, 'Overdue': 10 }
    };
    const productAnalytics = {
        totalProducts: 450,
        productMargin: 42.5,
        stockTurnover: '5.2',
        trendData: [
            { week: 'Week 1', revenue: 45000, views: 1200 },
            { week: 'Week 2', revenue: 52000, views: 1350 },
            { week: 'Week 3', revenue: 48000, views: 1250 },
            { week: 'Week 4', revenue: 55000, views: 1500 }
        ],
        bestSellers: [
            { productName: 'Premium Widget', totalQty: 120, totalRevenue: 45000, totalProfit: 18000, profitMargin: 40 },
            { productName: 'Standard Gadget', totalQty: 300, totalRevenue: 35000, totalProfit: 12000, profitMargin: 34.2 },
            { productName: 'Pro Setup', totalQty: 45, totalRevenue: 65000, totalProfit: 28000, profitMargin: 43.0 },
        ]
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const loading = false;

    return (
        <div className="flex bg-[#0f0f0f] w-full text-left font-poppins relative h-[700px] overflow-hidden">
            {/* Dummy Collapsed Sidebar */}
            <div className="w-[80px] bg-white border-r border-gray-200 flex-shrink-0 flex flex-col items-center py-4 z-10 shadow-sm relative">
                <div className="mb-6 border border-gray-200 p-2 rounded-lg cursor-pointer hover:bg-gray-50 text-black">
                    <MenuIcon style={{ color: 'black' }} />
                </div>
                <div className="flex flex-col gap-2 w-full px-2">
                    {sidebarItems.map((item, i) => (
                        <div
                            key={i}
                            className={`flex justify-center p-3 rounded-xl cursor-pointer transition-colors ${item.active ? 'bg-gray-100 text-black' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
                                }`}
                        >
                            {React.cloneElement(item.icon, { style: { color: 'black', fontSize: 24 } })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden relative custom-scrollbar bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
                {/* Dummy Navbar */}
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex-1 flex flex-col justify-center">
                        <img src={logo} alt="BizzOps Logo" className="h-6 w-auto object-contain object-left pointer-events-none" style={{ maxWidth: '120px' }} />
                    </div>
                    <div className="flex items-center gap-4 text-gray-800">
                        <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors relative flex items-center justify-center">
                            <NotificationsIcon style={{ color: 'black', fontSize: 24 }} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-black text-white text-sm font-semibold flex items-center justify-center border border-gray-900 cursor-pointer">
                            S
                        </div>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full filter drop-shadow-sm">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard Overview</h1>
                            <div className="flex items-center gap-3">
                                <DateRangeSelector value={dateRange} onChange={() => {}} />
                                <ExportButton onExportPDF={() => {}} onExportExcel={() => {}} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                            Last updated: Just now
                        </p>
                    </div>

                    {/* Business Health Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-1 transform transition-transform hover:-translate-y-1 duration-300">
                            <HealthScoreGauge
                                score={businessHealth.healthScore}
                                status={businessHealth.status}
                                color={businessHealth.color}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <InsightsPanel />
                        </div>
                    </div>

                    {/* Section 1: Sales Analytics */}
                    <div className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <BarChart3 size={20} />
                            </div>
                            Sales Analytics
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                            <KPICard title="Total Sales" value={`₹${salesAnalytics.totalSales.toLocaleString()}`} subtitle="All time revenue" trend="up" trendValue={salesAnalytics.salesGrowth} sparklineData={salesAnalytics.sparklineData} icon={<DollarSign size={18} />} loading={loading} />
                            <KPICard title="Monthly Sales" value={`₹${salesAnalytics.monthlySales.toLocaleString()}`} subtitle="Last 30 days" trend="up" trendValue={5.2} sparklineData={salesAnalytics.monthlySparklineData} icon={<TrendingUp size={18} />} loading={loading} />
                            <KPICard title="Daily Sales" value={`₹${salesAnalytics.dailySales.toLocaleString()}`} subtitle="Today's revenue" trend="up" trendValue={2.4} sparklineData={salesAnalytics.dailySparklineData} icon={<DollarSign size={18} />} loading={loading} />
                            <KPICard title="Sales Growth" value={`${salesAnalytics.salesGrowth.toFixed(1)}%`} subtitle="vs previous period" trend="up" trendValue={salesAnalytics.salesGrowth} icon={<TrendingUp size={18} />} loading={loading} />
                        </div>
                        <div className="transform transition-transform hover:-translate-y-1 duration-300 shadow-sm rounded-2xl overflow-hidden bg-white border border-gray-100">
                            <ChartCard title="Sales & Profit Trend">
                                <ResponsiveContainer width="100%" height={320}>
                                    <AreaChart data={salesAnalytics.sparklineData.map((val, idx) => ({ day: `Day ${idx + 1}`, sales: val, profit: val * 0.3 }))}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="day" stroke="#9CA3AF" tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9CA3AF" tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                        <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>
                    </div>

                    {/* Section 2: Financial Performance */}
                    <div className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <Wallet size={20} />
                            </div>
                            Financial Performance
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                            <KPICard title="Total Profit" value={`₹${financialPerformance.totalProfit.toLocaleString()}`} subtitle="Net earnings" icon={<DollarSign size={18} />} loading={loading} />
                            <KPICard title="Gross Profit Margin" value={`${financialPerformance.grossProfitMargin.toFixed(1)}%`} subtitle="Profit percentage" icon={<TrendingUp size={18} />} loading={loading} />
                            <KPICard title="Net Profit Margin" value={`${financialPerformance.netProfitMargin.toFixed(1)}%`} subtitle="After expenses" icon={<TrendingUp size={18} />} loading={loading} />
                            <KPICard title="Total Expenses" value={`₹${financialPerformance.totalExpenses.toLocaleString()}`} subtitle="Operating costs" icon={<DollarSign size={18} />} loading={loading} />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="transform transition-transform hover:-translate-y-1 duration-300 shadow-sm rounded-2xl overflow-hidden bg-white border border-gray-100">
                                <ChartCard title="Revenue vs Profit">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={[
                                            { name: 'Revenue', value: financialPerformance.totalRevenue },
                                            { name: 'Cost', value: financialPerformance.totalCost },
                                            { name: 'Profit', value: financialPerformance.totalProfit },
                                            { name: 'Expenses', value: financialPerformance.totalExpenses }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#9CA3AF" tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                            <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </div>
                            <div className="transform transition-transform hover:-translate-y-1 duration-300 shadow-sm rounded-2xl overflow-hidden bg-white border border-gray-100">
                                <ChartCard title="Expense Breakdown">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={financialPerformance.expenseBreakdown} cx="50%" cy="50%" inline={false} labelLine={false} outerRadius={100} fill="#8884d8" dataKey="amount" label={({cx, cy, midAngle, innerRadius, outerRadius, value, index}) => {
                                                const RADIAN = Math.PI / 180;
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                return (
                                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight={600}>
                                                        {financialPerformance.expenseBreakdown[index]._id}
                                                    </text>
                                                );
                                            }}>
                                                {financialPerformance.expenseBreakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} formatter={(value) => `₹${value.toLocaleString()}`} />
                                            <Legend iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </div>
                        </div>
                    </div>

                    {/* Additional sections can be mapped simply */}
                    <div className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Package size={20} />
                            </div>
                            Inventory Management
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                            <KPICard title="Total Stock Value" value={`₹${inventoryInsights.totalStockValue.toLocaleString()}`} subtitle="Current inventory worth" icon={<Package size={18} />} loading={loading} />
                            <KPICard title="Low Stock Items" value={inventoryInsights.lowStockItems} subtitle="Needs attention" icon={<AlertCircle size={18} />} loading={loading} />
                            <KPICard title="Inventory Turnover" value={inventoryInsights.inventoryTurnover} subtitle="Times per period" icon={<TrendingUp size={18} />} loading={loading} />
                            <KPICard title="Reorder Needed" value={inventoryInsights.reorderNeeded} subtitle="Items to restock" icon={<ShoppingCart size={18} />} loading={loading} />
                        </div>
                        <div className="transform transition-transform hover:-translate-y-1 duration-300 shadow-sm rounded-2xl overflow-hidden bg-white border border-gray-100">
                           <InventoryHealthChart inventoryInsights={inventoryInsights} />
                        </div>
                    </div>

                </div>
            </div>
            
            <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.02);
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: rgba(156, 163, 175, 0.5);
                border-radius: 20px;
            }
            .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                background-color: rgba(156, 163, 175, 0.8);
            }
            `}</style>
        </div>
    );
}

export default DummyDashboard;
