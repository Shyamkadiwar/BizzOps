import React, { useState, useEffect } from "react";
import {
    Box, Typography, Tabs, Tab, CircularProgress, Chip
} from "@mui/material";
import {
    TrendingUp, DollarSign, Wallet, TrendingDown, AlertCircle,
    ShoppingCart, FileText, Users
} from "lucide-react";
import Layout from "../Layout";
import axios from "axios";

function Report() {
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    const [totalSale, setTotalSales] = useState(0);
    const [todaySale, setTodaySales] = useState(0);
    const [MonthSale, setMonthSales] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [todayProfit, setTodayProfit] = useState(0);
    const [monthProfit, setMonthProfit] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [monthExpense, setMonthTotalExpense] = useState(0);
    const [oneDayExpense, setOneDayExpense] = useState(0);
    const [orders, setOrders] = useState(0);
    const [pendingOrders, setPendingOrders] = useState(0);
    const [invoices, setInvoices] = useState(0);
    const [unpaidInvoices, setUnpaidInvoices] = useState(0);
    const [customers, setCustomers] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                totalSaleRes, monthSaleRes, todaySaleRes,
                monthProfitRes, totalProfitRes, todayProfitRes,
                totalCostRes, totalExpenseRes, monthExpenseRes, oneExpenseRes,
                orderRes, pendingOrderRes, invoicesRes, unpaidInvoicesRes, customersRes
            ] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-alltime-sale`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-last30Day-sale`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-oneday-sale`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-last30Day-profit`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-alltime-profit`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-one-profit`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-alltime-cost`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/get-alltime-expense`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/get-last30day-expense`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/get-oneday-expense`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/orders/count-order`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/orders/get-pending-order`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/count-invoice`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/unpaid-invoice`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/count-customer`, { withCredentials: true })
            ]);

            setTotalSales(totalSaleRes.data.data.totalSalesValue);
            setMonthSales(monthSaleRes.data.data.totalSalesValue);
            setTodaySales(todaySaleRes.data.data.totalSalesValue);
            setTotalProfit(totalProfitRes.data.data.totalProfitValue);
            setMonthProfit(monthProfitRes.data.data.totalProfitValue);
            setTodayProfit(todayProfitRes.data.data.totalProfitValue);
            setTotalCost(totalCostRes.data.data.totalCostValue);
            setTotalExpense(totalExpenseRes.data.data.totalExpenseValue);
            setMonthTotalExpense(monthExpenseRes.data.data.totalExpenseValue);
            setOneDayExpense(oneExpenseRes.data.data.totalExpenseValue);
            setOrders(orderRes.data.data.totalOrders);
            setPendingOrders(pendingOrderRes.data.data.pendingCount);
            setInvoices(invoicesRes.data.data.invoiceCount);
            setUnpaidInvoices(unpaidInvoicesRes.data.data.totalUnpaidAmount);
            setCustomers(customersRes.data.data.count);
        } catch (error) { console.error("Error:", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const safe = (v) => (v && isFinite(v) ? v : 0);

    const totalNetIncome = totalProfit - totalExpense;
    const grossProfitMargin = safe((totalProfit / totalSale) * 100);
    const netProfitMargin = safe(((totalProfit - totalExpense) / totalSale) * 100);
    const avgSalePerOrder = safe(totalSale / orders);
    const profitPerOrder = safe(totalProfit / orders);
    const expenseRatio = safe((totalExpense / totalSale) * 100);

    const mNetIncome = monthProfit - monthExpense;
    const mGrossPM = safe((monthProfit / MonthSale) * 100);
    const mNetPM = safe(((monthProfit - monthExpense) / MonthSale) * 100);
    const mAvgSale = safe(MonthSale / orders);
    const mProfitPerOrder = safe(monthProfit / orders);
    const mExpRatio = safe((monthExpense / MonthSale) * 100);

    const dNetIncome = todayProfit - oneDayExpense;
    const dGrossPM = safe((todayProfit / todaySale) * 100);
    const dNetPM = safe(((todayProfit - oneDayExpense) / todaySale) * 100);
    const dAvgSale = safe(todaySale / orders);
    const dProfitPerOrder = safe(todayProfit / orders);
    const dExpRatio = safe((oneDayExpense / todaySale) * 100);

    const MetricCard = ({ icon, label, value, prefix = '', suffix = '', color }) => (
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
                    <h3 className="text-xl font-bold text-gray-900">
                        {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}{suffix}
                    </h3>
                </div>
            </div>
        </div>
    );

    const allTimeCards = [
        { icon: <DollarSign size={20} />, label: 'Total Sale', value: totalSale, prefix: '₹', color: '#3B82F6' },
        { icon: <TrendingUp size={20} />, label: 'Total Profit', value: totalProfit, prefix: '₹', color: '#10B981' },
        { icon: <Wallet size={20} />, label: 'Total Cost', value: totalCost, prefix: '₹', color: '#EF4444' },
        { icon: <AlertCircle size={20} />, label: 'Total Expense', value: totalExpense, prefix: '₹', color: '#F59E0B' },
        { icon: <TrendingUp size={20} />, label: 'Net Income', value: totalNetIncome, prefix: '₹', color: totalNetIncome >= 0 ? '#10B981' : '#EF4444' },
        { icon: <TrendingUp size={20} />, label: 'Gross Profit Margin', value: grossProfitMargin, suffix: '%', color: '#8B5CF6' },
        { icon: <TrendingUp size={20} />, label: 'Net Profit Margin', value: netProfitMargin, suffix: '%', color: '#6366F1' },
        { icon: <ShoppingCart size={20} />, label: 'Avg Sale/Order', value: avgSalePerOrder, prefix: '₹', color: '#0EA5E9' },
        { icon: <DollarSign size={20} />, label: 'Profit/Order', value: profitPerOrder, prefix: '₹', color: '#14B8A6' },
        { icon: <TrendingDown size={20} />, label: 'Expense Ratio', value: expenseRatio, suffix: '%', color: '#F97316' },
        { icon: <FileText size={20} />, label: 'Unpaid Invoices', value: unpaidInvoices, prefix: '₹', color: '#EF4444' },
        { icon: <ShoppingCart size={20} />, label: 'Total Orders', value: orders, color: '#3B82F6' },
    ];

    const monthCards = [
        { icon: <DollarSign size={20} />, label: 'Month Sale', value: MonthSale, prefix: '₹', color: '#3B82F6' },
        { icon: <TrendingUp size={20} />, label: 'Month Profit', value: monthProfit, prefix: '₹', color: '#10B981' },
        { icon: <AlertCircle size={20} />, label: 'Month Expense', value: monthExpense, prefix: '₹', color: '#F59E0B' },
        { icon: <TrendingUp size={20} />, label: 'Month Net Income', value: mNetIncome, prefix: '₹', color: mNetIncome >= 0 ? '#10B981' : '#EF4444' },
        { icon: <TrendingUp size={20} />, label: 'Gross Profit Margin', value: mGrossPM, suffix: '%', color: '#8B5CF6' },
        { icon: <TrendingUp size={20} />, label: 'Net Profit Margin', value: mNetPM, suffix: '%', color: '#6366F1' },
        { icon: <ShoppingCart size={20} />, label: 'Avg Sale/Order', value: mAvgSale, prefix: '₹', color: '#0EA5E9' },
        { icon: <DollarSign size={20} />, label: 'Profit/Order', value: mProfitPerOrder, prefix: '₹', color: '#14B8A6' },
        { icon: <TrendingDown size={20} />, label: 'Expense Ratio', value: mExpRatio, suffix: '%', color: '#F97316' },
    ];

    const dailyCards = [
        { icon: <DollarSign size={20} />, label: 'Daily Sale', value: todaySale, prefix: '₹', color: '#3B82F6' },
        { icon: <TrendingUp size={20} />, label: 'Daily Profit', value: todayProfit, prefix: '₹', color: '#10B981' },
        { icon: <AlertCircle size={20} />, label: 'Daily Expense', value: oneDayExpense, prefix: '₹', color: '#F59E0B' },
        { icon: <TrendingUp size={20} />, label: 'Daily Net Income', value: dNetIncome, prefix: '₹', color: dNetIncome >= 0 ? '#10B981' : '#EF4444' },
        { icon: <TrendingUp size={20} />, label: 'Gross Profit Margin', value: dGrossPM, suffix: '%', color: '#8B5CF6' },
        { icon: <TrendingUp size={20} />, label: 'Net Profit Margin', value: dNetPM, suffix: '%', color: '#6366F1' },
        { icon: <ShoppingCart size={20} />, label: 'Avg Sale/Order', value: dAvgSale, prefix: '₹', color: '#0EA5E9' },
        { icon: <DollarSign size={20} />, label: 'Profit/Order', value: dProfitPerOrder, prefix: '₹', color: '#14B8A6' },
        { icon: <TrendingDown size={20} />, label: 'Expense Ratio', value: dExpRatio, suffix: '%', color: '#F97316' },
    ];

    const tabCards = [allTimeCards, monthCards, dailyCards];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Financial Report</h1>
                        <p className="text-sm text-gray-600">Business performance overview</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Chip label={`${orders} Orders`} color="primary" variant="outlined" size="small" />
                        <Chip label={`${customers} Customers`} color="success" variant="outlined" size="small" />
                        <Chip label={`${pendingOrders} Pending`} color="warning" variant="outlined" size="small" />
                    </div>
                </div>

                {/* Segmented Controls */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center gap-1 bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-xl">
                        {['All Time', 'This Month', 'Today'].map((label, idx) => (
                            <button
                                key={idx}
                                onClick={() => setTabValue(idx)}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                    tabValue === idx 
                                        ? 'bg-white text-indigo-600 shadow-md transform scale-105' 
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <CircularProgress />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tabCards[tabValue].map((card, idx) => (
                            <MetricCard key={idx} {...card} />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default Report;