import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Sales } from "../models/sales.model.js";
import { Inventory } from "../models/inventory.model.js";
import { Customer } from "../models/customer.models.js";
import { Vendor } from "../models/vendor.model.js";
import { Product } from "../models/product.model.js";
import { Deal } from "../models/deal.model.js";
import { Task } from "../models/task.model.js";
import { Staff } from "../models/staff.model.js";
import { Invoice } from "../models/invoice.model.js";
import { Expense } from "../models/expense.model.js";

// Helper function to get date range filter
const getDateRangeFilter = (range) => {
    const now = new Date();
    let startDate;

    switch (range) {
        case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setDate(now.getDate() - 30));
            break;
        case 'quarter':
            startDate = new Date(now.setDate(now.getDate() - 90));
            break;
        case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        case 'alltime':
        default:
            return {};
    }

    return { date: { $gte: startDate } };
};

// Business Health Score (0-100)
export const getBusinessHealth = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const { range = 'month' } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const dateFilter = getDateRangeFilter(range);

    // Get sales performance (30%)
    const salesData = await Sales.aggregate([
        { $match: { owner, ...dateFilter } },
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalSale" },
                totalProfit: { $sum: "$totalProfit" }
            }
        }
    ]);

    const sales = salesData[0] || { totalSales: 0, totalProfit: 0 };
    const salesScore = Math.min((sales.totalSales / 100000) * 30, 30); // Normalize to 30%

    // Get profit margin (25%)
    const profitMargin = sales.totalSales > 0 ? (sales.totalProfit / sales.totalSales) * 100 : 0;
    const profitScore = Math.min((profitMargin / 40) * 25, 25); // 40% margin = full score

    // Get inventory health (15%)
    const inventoryData = await Inventory.aggregate([
        { $match: { owner } },
        {
            $group: {
                _id: null,
                totalItems: { $sum: 1 },
                lowStockItems: {
                    $sum: { $cond: [{ $lt: ["$stockRemain", 10] }, 1, 0] }
                }
            }
        }
    ]);

    const inventory = inventoryData[0] || { totalItems: 0, lowStockItems: 0 };
    const inventoryHealthRatio = inventory.totalItems > 0
        ? ((inventory.totalItems - inventory.lowStockItems) / inventory.totalItems) * 100
        : 100;
    const inventoryScore = (inventoryHealthRatio / 100) * 15;

    // Get customer satisfaction (15%) - based on repeat customers
    const customerData = await Customer.aggregate([
        { $match: { owner } },
        {
            $group: {
                _id: null,
                totalCustomers: { $sum: 1 },
                activeCustomers: {
                    $sum: { $cond: [{ $gt: ["$totalSales", 0] }, 1, 0] }
                }
            }
        }
    ]);

    const customers = customerData[0] || { totalCustomers: 0, activeCustomers: 0 };
    const customerSatisfaction = customers.totalCustomers > 0
        ? (customers.activeCustomers / customers.totalCustomers) * 100
        : 0;
    const customerScore = (customerSatisfaction / 100) * 15;

    // Get cash flow (15%) - based on unpaid invoices ratio
    const invoiceData = await Invoice.aggregate([
        { $match: { owner } },
        {
            $group: {
                _id: null,
                totalInvoices: { $sum: 1 },
                paidInvoices: {
                    $sum: { $cond: ["$paid", 1, 0] }
                }
            }
        }
    ]);

    const invoices = invoiceData[0] || { totalInvoices: 0, paidInvoices: 0 };
    const cashFlowRatio = invoices.totalInvoices > 0
        ? (invoices.paidInvoices / invoices.totalInvoices) * 100
        : 100;
    const cashFlowScore = (cashFlowRatio / 100) * 15;

    // Calculate total health score
    const healthScore = Math.round(salesScore + profitScore + inventoryScore + customerScore + cashFlowScore);

    // Determine status
    let status, color;
    if (healthScore >= 80) {
        status = "Excellent";
        color = "#10B981"; // Green
    } else if (healthScore >= 60) {
        status = "Good";
        color = "#3B82F6"; // Blue
    } else if (healthScore >= 40) {
        status = "Fair";
        color = "#F59E0B"; // Yellow
    } else {
        status = "Needs Attention";
        color = "#EF4444"; // Red
    }

    return res.status(200).json(
        new ApiResponse(200, {
            healthScore,
            status,
            color,
            breakdown: {
                salesPerformance: Math.round(salesScore),
                profitMargin: Math.round(profitScore),
                inventoryHealth: Math.round(inventoryScore),
                customerSatisfaction: Math.round(customerScore),
                cashFlow: Math.round(cashFlowScore)
            }
        }, "Business health score calculated successfully")
    );
});

// Sales Analytics
export const getSalesAnalytics = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const { range = 'month' } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const dateFilter = getDateRangeFilter(range);

    // Total sales
    const totalSalesData = await Sales.aggregate([
        { $match: { owner, ...dateFilter } },
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalSale" },
                totalProfit: { $sum: "$totalProfit" }
            }
        }
    ]);

    const totals = totalSalesData[0] || { totalSales: 0, totalProfit: 0 };

    // Daily sales (today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const dailySalesData = await Sales.aggregate([
        { $match: { owner, date: { $gte: todayStart } } },
        {
            $group: {
                _id: null,
                dailySales: { $sum: "$totalSale" }
            }
        }
    ]);

    const dailySales = dailySalesData[0]?.dailySales || 0;

    // Monthly sales (last 30 days)
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);
    const monthlySalesData = await Sales.aggregate([
        { $match: { owner, date: { $gte: monthStart } } },
        {
            $group: {
                _id: null,
                monthlySales: { $sum: "$totalSale" }
            }
        }
    ]);

    const monthlySales = monthlySalesData[0]?.monthlySales || 0;

    // Sales growth % (compare current period to previous period)
    const previousPeriodFilter = getDateRangeFilter(range);
    let previousStartDate;

    if (range === 'month') {
        previousStartDate = new Date();
        previousStartDate.setDate(previousStartDate.getDate() - 60);
        const previousEndDate = new Date();
        previousEndDate.setDate(previousEndDate.getDate() - 30);
        previousPeriodFilter.date = { $gte: previousStartDate, $lt: previousEndDate };
    }

    const previousSalesData = await Sales.aggregate([
        { $match: { owner, ...previousPeriodFilter } },
        {
            $group: {
                _id: null,
                previousSales: { $sum: "$totalSale" }
            }
        }
    ]);

    const previousSales = previousSalesData[0]?.previousSales || 0;
    const salesGrowth = previousSales > 0
        ? ((totals.totalSales - previousSales) / previousSales) * 100
        : 0;

    // Sales trend (last 7 days for sparkline)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const daySales = await Sales.aggregate([
            { $match: { owner, date: { $gte: date, $lt: nextDate } } },
            {
                $group: {
                    _id: null,
                    sales: { $sum: "$totalSale" }
                }
            }
        ]);

        last7Days.push(daySales[0]?.sales || 0);
    }

    // Monthly trend (last 7 months for sparkline)
    const last7Months = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const monthSales = await Sales.aggregate([
            { $match: { owner, date: { $gte: date, $lt: nextMonth } } },
            {
                $group: {
                    _id: null,
                    sales: { $sum: "$totalSale" }
                }
            }
        ]);

        last7Months.push(monthSales[0]?.sales || 0);
    }

    // Daily trend (last 7 hours for today)
    const last7Hours = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const hourStart = new Date(now);
        hourStart.setHours(now.getHours() - i, 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourEnd.getHours() + 1);

        const hourSales = await Sales.aggregate([
            { $match: { owner, date: { $gte: hourStart, $lt: hourEnd } } },
            {
                $group: {
                    _id: null,
                    sales: { $sum: "$totalSale" }
                }
            }
        ]);

        last7Hours.push(hourSales[0]?.sales || 0);
    }

    // Calculate monthly growth (current month vs previous month)
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const previousMonthStart = new Date(currentMonthStart);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);

    const currentMonthSales = await Sales.aggregate([
        { $match: { owner, date: { $gte: currentMonthStart } } },
        { $group: { _id: null, sales: { $sum: "$totalSale" } } }
    ]);

    const previousMonthSales = await Sales.aggregate([
        { $match: { owner, date: { $gte: previousMonthStart, $lt: currentMonthStart } } },
        { $group: { _id: null, sales: { $sum: "$totalSale" } } }
    ]);

    const currentMonthTotal = currentMonthSales[0]?.sales || 0;
    const previousMonthTotal = previousMonthSales[0]?.sales || 0;
    const monthlyGrowth = previousMonthTotal > 0
        ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
        : 0;

    // Calculate daily growth (today vs yesterday)
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const yesterdaySales = await Sales.aggregate([
        { $match: { owner, date: { $gte: yesterdayStart, $lt: todayStart } } },
        { $group: { _id: null, sales: { $sum: "$totalSale" } } }
    ]);

    const yesterdayTotal = yesterdaySales[0]?.sales || 0;
    const dailyGrowth = yesterdayTotal > 0
        ? ((dailySales - yesterdayTotal) / yesterdayTotal) * 100
        : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            totalSales: totals.totalSales,
            monthlySales,
            dailySales,
            salesGrowth: Math.round(salesGrowth * 100) / 100,
            monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
            dailyGrowth: Math.round(dailyGrowth * 100) / 100,
            totalProfit: totals.totalProfit,
            sparklineData: last7Days,
            monthlySparklineData: last7Months,
            dailySparklineData: last7Hours
        }, "Sales analytics retrieved successfully")
    );
});

// Financial Performance
export const getFinancialPerformance = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const { range = 'month' } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const dateFilter = getDateRangeFilter(range);

    // Get sales and profit data
    const salesData = await Sales.aggregate([
        { $match: { owner, ...dateFilter } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalSale" },
                totalProfit: { $sum: "$totalProfit" },
                totalCost: { $sum: "$totalCost" }
            }
        }
    ]);

    const sales = salesData[0] || { totalRevenue: 0, totalProfit: 0, totalCost: 0 };

    // Get expenses
    const expenseData = await Expense.aggregate([
        { $match: { owner, ...dateFilter } },
        {
            $group: {
                _id: null,
                totalExpenses: { $sum: "$amount" }
            }
        }
    ]);

    const totalExpenses = expenseData[0]?.totalExpenses || 0;

    // Calculate margins
    const grossProfitMargin = sales.totalRevenue > 0
        ? ((sales.totalProfit / sales.totalRevenue) * 100)
        : 0;

    const netProfit = sales.totalProfit - totalExpenses;
    const netProfitMargin = sales.totalRevenue > 0
        ? ((netProfit / sales.totalRevenue) * 100)
        : 0;

    // Expense breakdown by category
    const expenseBreakdown = await Expense.aggregate([
        { $match: { owner, ...dateFilter } },
        {
            $group: {
                _id: "$category",
                amount: { $sum: "$amount" }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            totalProfit: sales.totalProfit,
            grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
            netProfitMargin: Math.round(netProfitMargin * 100) / 100,
            totalExpenses,
            netProfit,
            totalRevenue: sales.totalRevenue,
            totalCost: sales.totalCost,
            expenseBreakdown
        }, "Financial performance retrieved successfully")
    );
});

// Inventory Insights
export const getInventoryInsights = asyncHandler(async (req, res) => {
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Total stock value and low stock items
    const inventoryData = await Inventory.aggregate([
        { $match: { owner } },
        {
            $group: {
                _id: null,
                totalStockValue: { $sum: { $multiply: ["$stockRemain", "$salePrice"] } },
                totalItems: { $sum: 1 },
                lowStockItems: {
                    $sum: { $cond: [{ $lt: ["$stockRemain", 10] }, 1, 0] }
                },
                outOfStockItems: {
                    $sum: { $cond: [{ $eq: ["$stockRemain", 0] }, 1, 0] }
                }
            }
        }
    ]);

    const inventory = inventoryData[0] || {
        totalStockValue: 0,
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0
    };

    // Get low stock items list
    const lowStockList = await Inventory.find({ owner, stockRemain: { $lt: 10, $gt: 0 } })
        .select('item stockRemain')
        .limit(5);

    // Calculate inventory turnover (simplified - sales / avg inventory value)
    const salesData = await Sales.aggregate([
        { $match: { owner } },
        {
            $group: {
                _id: null,
                totalCost: { $sum: "$totalCost" }
            }
        }
    ]);

    const totalCost = salesData[0]?.totalCost || 0;
    const inventoryTurnover = inventory.totalStockValue > 0
        ? Math.round((totalCost / inventory.totalStockValue) * 100) / 100
        : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            totalStockValue: inventory.totalStockValue,
            lowStockItems: inventory.lowStockItems,
            outOfStockItems: inventory.outOfStockItems,
            inventoryTurnover,
            reorderNeeded: inventory.lowStockItems + inventory.outOfStockItems,
            lowStockList
        }, "Inventory insights retrieved successfully")
    );
});

// Customer Intelligence
export const getCustomerIntelligence = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const { range = 'month' } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const dateFilter = getDateRangeFilter(range);

    // Total customers
    const totalCustomers = await Customer.countDocuments({ owner });

    // New customers in period
    const newCustomers = await Customer.countDocuments({
        owner,
        createdAt: dateFilter.date || { $exists: true }
    });

    // Customer lifetime value (average total sales per customer)
    const clvData = await Customer.aggregate([
        { $match: { owner } },
        {
            $group: {
                _id: null,
                avgLifetimeValue: { $avg: "$totalSales" },
                totalRevenue: { $sum: "$totalSales" }
            }
        }
    ]);

    const clv = clvData[0]?.avgLifetimeValue || 0;

    // Retention rate (customers with multiple purchases)
    const repeatCustomers = await Customer.countDocuments({
        owner,
        totalSales: { $gt: 0 }
    });

    const retentionRate = totalCustomers > 0
        ? (repeatCustomers / totalCustomers) * 100
        : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            totalCustomers,
            newCustomers,
            customerLifetimeValue: Math.round(clv),
            retentionRate: Math.round(retentionRate * 100) / 100
        }, "Customer intelligence retrieved successfully")
    );
});

// Vendor Performance
export const getVendorPerformance = asyncHandler(async (req, res) => {
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Total and active vendors
    const totalVendors = await Vendor.countDocuments({ owner });
    const activeVendors = await Vendor.countDocuments({
        owner,
        totalPurchases: { $gt: 0 }
    });

    // Average payment time (simplified - based on vendor balance)
    const vendorData = await Vendor.aggregate([
        { $match: { owner } },
        {
            $group: {
                _id: null,
                avgBalance: { $avg: "$balance" },
                totalPurchases: { $sum: "$totalPurchases" }
            }
        }
    ]);

    const avgPaymentTime = 30; // Placeholder - would need transaction timestamps

    // Vendor rating (placeholder - no rating system exists)
    const vendorRating = 4.2;

    return res.status(200).json(
        new ApiResponse(200, {
            totalVendors,
            activeVendors,
            avgPaymentTime,
            vendorRating
        }, "Vendor performance retrieved successfully")
    );
});

// Order Fulfillment
export const getOrderFulfillment = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const { range = 'month' } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const dateFilter = getDateRangeFilter(range);

    // Import Order model
    const { Order } = await import('../models/orders.model.js');

    // Total orders
    const totalOrders = await Order.countDocuments({ owner, ...dateFilter });

    // Pending orders
    const pendingOrders = await Order.countDocuments({
        owner,
        status: { $in: ['Pending', 'Processing'] },
        ...dateFilter
    });

    // Fulfilled orders
    const fulfilledOrders = await Order.countDocuments({
        owner,
        status: 'Completed',
        ...dateFilter
    });

    // Average fulfillment time (placeholder)
    const avgFulfillmentTime = 3; // days

    return res.status(200).json(
        new ApiResponse(200, {
            totalOrders,
            pendingOrders,
            fulfilledOrders,
            avgFulfillmentTime
        }, "Order fulfillment metrics retrieved successfully")
    );
});

// Deals Pipeline
export const getDealsPipeline = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const { range = 'month' } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const dateFilter = getDateRangeFilter(range);

    // Total deals
    const totalDeals = await Deal.countDocuments({ owner, ...dateFilter });

    // Deal value
    const dealData = await Deal.aggregate([
        { $match: { owner, ...dateFilter } },
        {
            $group: {
                _id: null,
                totalValue: { $sum: "$value" },
                wonValue: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "Won"] }, "$value", 0]
                    }
                },
                wonCount: {
                    $sum: { $cond: [{ $eq: ["$status", "Won"] }, 1, 0] }
                }
            }
        }
    ]);

    const deals = dealData[0] || { totalValue: 0, wonValue: 0, wonCount: 0 };

    // Conversion rate
    const conversionRate = totalDeals > 0
        ? (deals.wonCount / totalDeals) * 100
        : 0;

    // Average deal size
    const avgDealSize = totalDeals > 0
        ? deals.totalValue / totalDeals
        : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            totalDeals,
            dealValue: deals.totalValue,
            conversionRate: Math.round(conversionRate * 100) / 100,
            avgDealSize: Math.round(avgDealSize)
        }, "Deals pipeline metrics retrieved successfully")
    );
});

// Appointments & Tasks
export const getAppointmentsTasks = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const { range = 'month' } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const dateFilter = getDateRangeFilter(range);

    // Import Appointment model
    const { Appointment } = await import('../models/appointment.model.js');

    // Total appointments
    const totalAppointments = await Appointment.countDocuments({ owner, ...dateFilter });

    // Total tasks
    const totalTasks = await Task.countDocuments({ owner, ...dateFilter });

    // Completed tasks
    const completedTasks = await Task.countDocuments({
        owner,
        status: 'Done',
        ...dateFilter
    });

    // Pending tasks
    const pendingTasks = await Task.countDocuments({
        owner,
        status: { $ne: 'Done' },
        ...dateFilter
    });

    // Task completion rate
    const taskCompletionRate = totalTasks > 0
        ? (completedTasks / totalTasks) * 100
        : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            totalAppointments,
            completedTasks,
            pendingTasks,
            taskCompletionRate: Math.round(taskCompletionRate * 100) / 100
        }, "Appointments and tasks metrics retrieved successfully")
    );
});

// Staff Performance
export const getStaffPerformance = asyncHandler(async (req, res) => {
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Total staff
    const totalStaff = await Staff.countDocuments({ owner });

    // Active staff (placeholder - all staff considered active)
    const activeStaff = totalStaff;

    // Average sales per staff (total sales / staff count)
    const salesData = await Sales.aggregate([
        { $match: { owner } },
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalSale" }
            }
        }
    ]);

    const totalSales = salesData[0]?.totalSales || 0;
    const avgSalesPerStaff = totalStaff > 0
        ? totalSales / totalStaff
        : 0;

    // Productivity score (placeholder - based on sales performance)
    const productivityScore = 85;

    return res.status(200).json(
        new ApiResponse(200, {
            totalStaff,
            activeStaff,
            avgSalesPerStaff: Math.round(avgSalesPerStaff),
            productivityScore
        }, "Staff performance metrics retrieved successfully")
    );
});

// Invoice Management
export const getInvoiceManagement = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const { range = 'month' } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const dateFilter = getDateRangeFilter(range);

    // Total invoices
    const totalInvoices = await Invoice.countDocuments({ owner, ...dateFilter });

    // Paid invoices
    const paidInvoices = await Invoice.countDocuments({
        owner,
        paid: true,
        ...dateFilter
    });

    // Unpaid amount
    const unpaidData = await Invoice.aggregate([
        { $match: { owner, paid: false, ...dateFilter } },
        {
            $group: {
                _id: null,
                unpaidAmount: { $sum: "$grandTotal" }
            }
        }
    ]);

    const unpaidAmount = unpaidData[0]?.unpaidAmount || 0;

    // Average payment days (placeholder)
    const avgPaymentDays = 15;

    return res.status(200).json(
        new ApiResponse(200, {
            totalInvoices,
            paidInvoices,
            unpaidAmount,
            avgPaymentDays
        }, "Invoice management metrics retrieved successfully")
    );
});

// Product Analytics
export const getProductAnalytics = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const { range = 'month' } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const dateFilter = getDateRangeFilter(range);

    // Total products
    const totalProducts = await Product.countDocuments({ owner });

    // Best sellers (top 5 products by sales)
    const bestSellers = await Sales.aggregate([
        { $match: { owner, ...dateFilter } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.product",
                totalQty: { $sum: "$items.qty" },
                totalRevenue: { $sum: "$items.itemTotal" },
                totalProfit: { $sum: "$items.itemProfit" }
            }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: "inventories",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $project: {
                productName: "$product.item",
                totalQty: 1,
                totalRevenue: 1,
                totalProfit: 1,
                profitMargin: {
                    $cond: [
                        { $gt: ["$totalRevenue", 0] },
                        { $multiply: [{ $divide: ["$totalProfit", "$totalRevenue"] }, 100] },
                        0
                    ]
                }
            }
        }
    ]);

    // Average product margin
    const productMarginData = await Sales.aggregate([
        { $match: { owner, ...dateFilter } },
        { $unwind: "$items" },
        {
            $group: {
                _id: null,
                avgMargin: {
                    $avg: {
                        $multiply: [
                            { $divide: ["$items.itemProfit", "$items.itemTotal"] },
                            100
                        ]
                    }
                }
            }
        }
    ]);

    const productMargin = productMarginData[0]?.avgMargin || 0;

    // Stock turnover (simplified)
    const stockTurnover = 5.2; // Placeholder

    return res.status(200).json(
        new ApiResponse(200, {
            totalProducts,
            bestSellers,
            productMargin: Math.round(productMargin * 100) / 100,
            stockTurnover
        }, "Product analytics retrieved successfully")
    );
});
