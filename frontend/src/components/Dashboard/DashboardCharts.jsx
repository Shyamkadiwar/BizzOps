import React from 'react';
import ChartCard from './ChartCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

// Inventory Health Donut Chart
export const InventoryHealthChart = ({ inventoryInsights }) => {
    if (!inventoryInsights) return null;

    const inStock = Math.max(0, (inventoryInsights.totalItems || 0) - (inventoryInsights.lowStockItems || 0) - (inventoryInsights.outOfStockItems || 0));
    const lowStock = inventoryInsights.lowStockItems || 0;
    const outOfStock = inventoryInsights.outOfStockItems || 0;

    // If all values are 0, show a message
    if (inStock === 0 && lowStock === 0 && outOfStock === 0) {
        return (
            <ChartCard title="Inventory Health Distribution">
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No inventory data available
                </div>
            </ChartCard>
        );
    }

    const data = [
        { name: 'In Stock', value: inStock },
        { name: 'Low Stock', value: lowStock },
        { name: 'Out of Stock', value: outOfStock }
    ].filter(item => item.value > 0); // Only show non-zero values

    return (
        <ChartCard title="Inventory Health Distribution">
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                        {data.map((entry, index) => {
                            const colors = { 'In Stock': '#10B981', 'Low Stock': '#F59E0B', 'Out of Stock': '#EF4444' };
                            return <Cell key={`cell-${index}`} fill={colors[entry.name]} />;
                        })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

// Customer Segmentation Pie Chart
export const CustomerSegmentationChart = ({ customerIntelligence }) => {
    if (!customerIntelligence) return null;

    const activeCustomers = Math.round((customerIntelligence.totalCustomers || 0) * (customerIntelligence.retentionRate || 0) / 100);
    const inactiveCustomers = (customerIntelligence.totalCustomers || 0) - activeCustomers;
    const newCustomers = customerIntelligence.newCustomers || 0;

    if (activeCustomers === 0 && inactiveCustomers === 0 && newCustomers === 0) {
        return (
            <ChartCard title="Customer Segmentation">
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No customer data available
                </div>
            </ChartCard>
        );
    }

    const data = [
        { name: 'Active Customers', value: activeCustomers },
        { name: 'Inactive Customers', value: inactiveCustomers },
        { name: 'New Customers', value: newCustomers }
    ].filter(item => item.value > 0);

    return (
        <ChartCard title="Customer Segmentation">
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

// Vendor Performance Bar Chart
export const VendorPerformanceChart = ({ vendorPerformance }) => {
    if (!vendorPerformance) return null;

    const data = [
        { name: 'Total Vendors', value: vendorPerformance.totalVendors || 0 },
        { name: 'Active Vendors', value: vendorPerformance.activeVendors || 0 },
        { name: 'Inactive Vendors', value: (vendorPerformance.totalVendors || 0) - (vendorPerformance.activeVendors || 0) }
    ];

    const hasData = data.some(item => item.value > 0);
    if (!hasData) {
        return (
            <ChartCard title="Vendor Activity Status">
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No vendor data available
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard title="Vendor Activity Status">
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

// Order Fulfillment Funnel Chart
export const OrderFulfillmentChart = ({ orderFulfillment }) => {
    if (!orderFulfillment) return null;

    const data = [
        { name: 'Total Orders', value: orderFulfillment.totalOrders || 0 },
        { name: 'Pending Orders', value: orderFulfillment.pendingOrders || 0 },
        { name: 'Fulfilled Orders', value: orderFulfillment.fulfilledOrders || 0 }
    ];

    const hasData = data.some(item => item.value > 0);
    if (!hasData) {
        return (
            <ChartCard title="Order Fulfillment Pipeline">
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No order data available
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard title="Order Fulfillment Pipeline">
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#6B7280" />
                    <YAxis dataKey="name" type="category" stroke="#6B7280" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        <Cell fill="#3B82F6" />
                        <Cell fill="#F59E0B" />
                        <Cell fill="#10B981" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

// Deals Pipeline Chart
export const DealsPipelineChart = ({ dealsPipeline }) => {
    if (!dealsPipeline || dealsPipeline.totalDeals === 0) {
        return (
            <ChartCard title="Deals Conversion Funnel">
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No deals data available
                </div>
            </ChartCard>
        );
    }

    const wonDeals = Math.round((dealsPipeline.totalDeals || 0) * (dealsPipeline.conversionRate || 0) / 100);
    const lostDeals = (dealsPipeline.totalDeals || 0) - wonDeals;

    const data = [
        { name: 'Total Deals', value: dealsPipeline.totalDeals || 0 },
        { name: 'Won Deals', value: wonDeals },
        { name: 'Lost Deals', value: lostDeals }
    ];

    return (
        <ChartCard title="Deals Conversion Funnel">
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#6B7280" />
                    <YAxis dataKey="name" type="category" stroke="#6B7280" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        <Cell fill="#3B82F6" />
                        <Cell fill="#10B981" />
                        <Cell fill="#EF4444" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

// Task Completion Chart
export const TaskCompletionChart = ({ appointmentsTasks }) => {
    if (!appointmentsTasks) return null;

    const completed = appointmentsTasks.completedTasks || 0;
    const pending = appointmentsTasks.pendingTasks || 0;

    if (completed === 0 && pending === 0) {
        return (
            <ChartCard title="Task Status Distribution">
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No task data available
                </div>
            </ChartCard>
        );
    }

    const data = [
        { name: 'Completed', value: completed },
        { name: 'Pending', value: pending }
    ].filter(item => item.value > 0);

    return (
        <ChartCard title="Task Status Distribution">
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                        <Cell fill="#10B981" />
                        <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

// Staff Performance Radar Chart
export const StaffPerformanceRadarChart = ({ staffPerformance }) => {
    if (!staffPerformance) return null;

    const data = [
        { subject: 'Total Staff', value: (staffPerformance.totalStaff || 0) * 10 },
        { subject: 'Active Staff', value: (staffPerformance.activeStaff || 0) * 10 },
        { subject: 'Productivity', value: staffPerformance.productivityScore || 0 },
        { subject: 'Avg Sales', value: Math.min((staffPerformance.avgSalesPerStaff || 0) / 1000, 100) }
    ];

    const hasData = data.some(item => item.value > 0);
    if (!hasData) {
        return (
            <ChartCard title="Staff Performance Metrics">
                <div className="flex items-center justify-center h-72 text-gray-500">
                    No staff performance data available
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard title="Staff Performance Metrics">
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={data}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="subject" stroke="#6B7280" />
                    <PolarRadiusAxis stroke="#6B7280" />
                    <Radar name="Performance" dataKey="value" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.6} />
                    <Tooltip />
                </RadarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

// Invoice Status Chart
export const InvoiceStatusChart = ({ invoiceManagement }) => {
    if (!invoiceManagement) return null;

    const data = [
        { name: 'Paid Invoices', value: invoiceManagement.paidInvoices || 0 },
        { name: 'Unpaid Invoices', value: (invoiceManagement.totalInvoices || 0) - (invoiceManagement.paidInvoices || 0) }
    ];

    const hasData = data.some(item => item.value > 0);
    if (!hasData) {
        return (
            <ChartCard title="Invoice Payment Status">
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No invoice data available
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard title="Invoice Payment Status">
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        <Cell fill="#10B981" />
                        <Cell fill="#EF4444" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

// Product Performance Trend
export const ProductPerformanceTrend = ({ productAnalytics }) => {
    if (!productAnalytics || !productAnalytics.bestSellers || productAnalytics.bestSellers.length === 0) {
        return (
            <ChartCard title="Top Products Performance">
                <div className="flex items-center justify-center h-72 text-gray-500">
                    No product sales data available
                </div>
            </ChartCard>
        );
    }

    const data = productAnalytics.bestSellers.map(product => ({
        name: product.productName.substring(0, 15) + (product.productName.length > 15 ? '...' : ''),
        revenue: product.totalRevenue,
        profit: product.totalProfit
    }));

    return (
        <ChartCard title="Top Products Performance">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#6B7280" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Revenue" />
                    <Bar dataKey="profit" fill="#10B981" radius={[8, 8, 0, 0]} name="Profit" />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

export default {
    InventoryHealthChart,
    CustomerSegmentationChart,
    VendorPerformanceChart,
    OrderFulfillmentChart,
    DealsPipelineChart,
    TaskCompletionChart,
    StaffPerformanceRadarChart,
    InvoiceStatusChart,
    ProductPerformanceTrend
};
