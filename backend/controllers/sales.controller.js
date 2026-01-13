import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Sales } from "../models/sales.model.js";
import { Inventory } from "../models/inventory.model.js";
import { Invoice } from "../models/invoice.model.js";
import { Customer } from "../models/customer.models.js";
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Add Multi-Item Sale (now the unified addSale function)
const addSale = asyncHandler(async (req, res) => {
    const { items, customer, customerName, customerEmail, customerPhone, customerCity, date, paid } = req.body;
    const owner = req.user?._id;

    if (!items || items.length === 0) {
        throw new ApiError(400, "At least one item is required");
    }

    if (!date) {
        throw new ApiError(400, "Date is required");
    }

    // Process each item and validate inventory
    const processedItems = [];
    let totalSale = 0;
    let totalCost = 0;

    for (const item of items) {
        const inventoryItem = await Inventory.findById(item.product);

        if (!inventoryItem) {
            throw new ApiError(404, `Product not found: ${item.product}`);
        }

        if (inventoryItem.stockRemain < item.qty) {
            throw new ApiError(400, `Not enough stock for ${inventoryItem.item}. Only ${inventoryItem.stockRemain} units available`);
        }

        const itemPrice = inventoryItem.salePrice;
        const itemCost = inventoryItem.cost;
        const itemTaxes = inventoryItem.taxes || [];

        const itemTotal = itemPrice * item.qty;
        const itemCostTotal = itemCost * item.qty;
        const itemProfit = itemTotal - itemCostTotal;

        processedItems.push({
            product: item.product,
            productName: inventoryItem.item,
            qty: item.qty,
            price: itemPrice,
            cost: itemCost,
            taxes: itemTaxes,
            itemTotal,
            itemProfit
        });

        totalSale += itemTotal;
        totalCost += itemCostTotal;
    }

    const totalProfit = totalSale - totalCost;
    const profitPercent = totalCost > 0 ? ((totalSale - totalCost) / totalCost) * 100 : 0;

    // Auto-create customer if needed
    let customerId = customer;
    let customerData = null;

    if (!customer && customerName && (customerEmail || customerPhone)) {
        try {
            const newCustomer = await Customer.create({
                owner,
                name: customerName,
                email: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '')}@customer.com`,
                phone: customerPhone || '0000000000',
                city: customerCity || 'N/A'
            });
            customerId = newCustomer._id;
            customerData = newCustomer;
        } catch (error) {
            console.log('Could not create customer:', error.message);
        }
    } else if (customer) {
        customerData = await Customer.findById(customer);
    }

    // Create sale
    const newSale = await Sales.create({
        owner,
        items: processedItems,
        customer: customerId || null,
        customerName: customerData?.name || customerName || 'Walk-in Customer',
        totalSale,
        totalCost,
        totalProfit,
        profitPercent,
        paid: paid || false,
        date: new Date(date)
    });

    // Create invoice with all items
    const invoiceItems = processedItems.map(item => {
        const itemTaxes = item.taxes.map(tax => ({
            name: tax.name,
            rate: tax.rate,
            amount: (item.itemTotal * tax.rate) / 100
        }));

        const itemTaxAmount = itemTaxes.reduce((sum, tax) => sum + tax.amount, 0);

        return {
            itemName: item.productName,
            qty: item.qty,
            price: item.price,
            cost: item.cost,
            taxes: itemTaxes,
            total: item.itemTotal + itemTaxAmount
        };
    });

    const totalTaxAmount = invoiceItems.reduce((sum, item) =>
        sum + item.taxes.reduce((taxSum, tax) => taxSum + tax.amount, 0), 0
    );

    const invoice = await Invoice.create({
        owner,
        sale: newSale._id,
        customer: customerId || null,
        customerName: customerData?.name || customerName || 'Walk-in Customer',
        customerEmail: customerData?.email || '',
        customerPhone: customerData?.phone || '',
        customerAddress: customerData?.address || '',
        name: processedItems.length === 1 ? `Invoice for ${processedItems[0].productName}` : `Multi-Item Invoice`,
        items: invoiceItems,
        paid: paid || false,
        subTotal: totalSale,
        grandTotal: totalSale + totalTaxAmount,
        date: new Date(date)
    });

    // Update sale with invoice reference
    newSale.invoice = invoice._id;
    await newSale.save();

    // Update customer balance and stats if customer exists
    if (customerId) {
        const CustomerTransaction = (await import('../models/customerTransaction.model.js')).CustomerTransaction;
        const grandTotal = totalSale + totalTaxAmount;

        if (!paid) {
            // Unpaid sale - update balance, totalSales, and totalProfit
            const updatedCustomer = await Customer.findByIdAndUpdate(
                customerId,
                {
                    $inc: {
                        balance: grandTotal,
                        totalSales: grandTotal,
                        totalProfit: totalProfit
                    }
                },
                { new: true }
            );

            // Create customer transaction
            if (updatedCustomer) {
                const itemsList = processedItems.map(item => `${item.productName} (Qty: ${item.qty})`).join(', ');
                await CustomerTransaction.create({
                    owner,
                    customer: customerId,
                    type: 'sale',
                    amount: grandTotal,
                    balanceAfter: updatedCustomer.balance,
                    description: processedItems.length === 1 ? `Sale: ${itemsList}` : `Multi-item sale: ${itemsList}`,
                    sale: newSale._id,
                    invoice: invoice._id,
                    date: new Date(date)
                });
            }
        } else {
            // Paid sale - only update totalSales and totalProfit, not balance
            await Customer.findByIdAndUpdate(
                customerId,
                {
                    $inc: {
                        totalSales: grandTotal,
                        totalProfit: totalProfit
                    }
                }
            );
        }
    }

    return res.status(201).json(
        new ApiResponse(201, {
            sale: newSale,
            invoice
        }, "Sale and invoice created successfully")
    );
});

const getSales = asyncHandler(async (req, res) => {
    const { timeFilter } = req.params;
    const ownerId = req.user?._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = { owner: ownerId };

    switch (timeFilter) {
        case 'oneday':
            const oneDayAgo = new Date(new Date().setDate(new Date().getDate() - 1));
            filter.date = { $gte: oneDayAgo };
            break;
        case 'past30days':
            const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
            filter.date = { $gte: thirtyDaysAgo };
            break;
        case 'alltime':
        default:
            break;
    }

    // Fetch all sales
    const allSales = await Sales.find(filter)
        .populate('customer')
        .populate('items.product')
        .sort({ date: -1 });

    // Transform multi-item sales into individual rows (one per item)
    const transformedSales = [];
    allSales.forEach(sale => {
        sale.items.forEach(item => {
            transformedSales.push({
                _id: `${sale._id}_${item.product._id}`, // Unique ID for each row
                owner: sale.owner,
                product: item.product,
                productName: item.productName,
                customer: sale.customer,
                customerName: sale.customerName,
                price: item.price,
                cost: item.cost,
                taxes: item.taxes,
                qty: item.qty,
                profitPercent: item.cost > 0 ? ((item.price - item.cost) / item.cost) * 100 : 0,
                profit: item.itemProfit,
                sale: item.itemTotal,
                invoice: sale.invoice,
                paid: sale.paid,
                date: sale.date,
                createdAt: sale.createdAt,
                updatedAt: sale.updatedAt,
                isMultiItemSale: true,
                parentSaleId: sale._id
            });
        });
    });

    // Apply pagination
    const totalCount = transformedSales.length;
    const paginatedSales = transformedSales.slice(skip, skip + limit);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            sales: paginatedSales,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                limit
            }
        }, "Sales fetched successfully"));
});

const getTotalSalesValueOneDay = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await Sales.aggregate([
        { $match: { owner: ownerId, date: { $gte: startOfToday } } },
        {
            $group: {
                _id: null,
                totalSalesValue: { $sum: "$totalSale" },
            },
        },
    ]);

    const totalSalesValue = result.length > 0 ? result[0].totalSalesValue : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, { totalSalesValue }, "Total sales value for one day retrieved successfully"));
});

const getTotalSalesValueLast30Days = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;

    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));

    const result = await Sales.aggregate([
        { $match: { owner: ownerId, date: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: null,
                totalSalesValue: { $sum: "$totalSale" }
            }
        }
    ]);

    const totalSalesValue = result.length > 0 ? result[0].totalSalesValue : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, { totalSalesValue }, "Total sales value for past 30 days retrieved successfully"));
});

const getTotalSalesValueAllTime = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;

    const result = await Sales.aggregate([
        { $match: { owner: ownerId } },
        {
            $group: {
                _id: null,
                totalSalesValue: { $sum: "$totalSale" }
            }
        }
    ]);

    const totalSalesValue = result.length > 0 ? result[0].totalSalesValue : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, { totalSalesValue }, "Total sales value for all time retrieved successfully"));
});

const getTotalProfitValueOneDay = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await Sales.aggregate([
        { $match: { owner: ownerId, date: { $gte: startOfToday } } },
        {
            $group: {
                _id: null,
                totalProfitValue: { $sum: "$totalProfit" },
            },
        },
    ]);

    const totalProfitValue = result.length > 0 ? result[0].totalProfitValue : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, { totalProfitValue }, "Total profit value for one day retrieved successfully"));
});

const getTotalProfitValueLast30Days = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));

    const result = await Sales.aggregate([
        { $match: { owner: ownerId, date: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: null,
                totalProfitValue: { $sum: "$totalProfit" }
            }
        }
    ]);

    const totalProfitValue = result.length > 0 ? result[0].totalProfitValue : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, { totalProfitValue }, "Total profit value for last 30 days retrived successfull"));
});

const getTotalProfitValueAllTime = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    const result = await Sales.aggregate([
        { $match: { owner: ownerId } },
        {
            $group: {
                _id: null,
                totalProfitValue: { $sum: "$totalProfit" }
            }
        }
    ]);

    const totalProfitValue = result.length > 0 ? result[0].totalProfitValue : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, { totalProfitValue }, "Total profit  retrived successfull"));
});

const getTotalCostValueAllTime = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    const result = await Sales.aggregate([
        { $match: { owner: ownerId } },
        {
            $group: {
                _id: null,
                totalCostValue: { $sum: "$totalCost" }
            }
        }
    ]);

    const totalCostValue = result.length > 0 ? result[0].totalCostValue : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, { totalCostValue }, "Total cost retrived successfull"));
});

const getDailyTotalSalesValuePast30Days = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));

    const results = await Sales.aggregate([
        {
            $match: {
                owner: ownerId,
                date: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$date" }
                },
                totalSalesValue: { $sum: "$totalSale" }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    const dailySalesValue = {};
    results.forEach(item => {
        dailySalesValue[item._id] = item.totalSalesValue;
    });
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const formattedDate = date.toISOString().split('T')[0];
        if (!dailySalesValue[formattedDate]) {
            dailySalesValue[formattedDate] = 0;
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, dailySalesValue, "Daily total sales value for the past 30 days retrieved successfully"));
});

const getDailyProfitLast30Days = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    const today = new Date();
    const past30Days = new Date(today.setDate(today.getDate() - 30));

    const results = await Sales.aggregate([
        {
            $match: {
                owner: ownerId,
                date: { $gte: past30Days }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$date" }
                },
                totalProfitValue: { $sum: "$totalProfit" }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    const dailyProfitValue = {};
    results.forEach(item => {
        dailyProfitValue[item._id] = item.totalProfitValue;
    });

    const todayFormatted = today.toISOString().split('T')[0];
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const formattedDate = date.toISOString().split('T')[0];
        if (!dailyProfitValue[formattedDate]) {
            dailyProfitValue[formattedDate] = 0;
        }
    }

    return res.status(200).json(new ApiResponse(200, dailyProfitValue, "Daily total profit value for the past 30 days retrieved successfully"));
});

const getDailyTotalCostValuePast30Days = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));

    const results = await Sales.aggregate([
        {
            $match: {
                owner: ownerId,
                date: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$date" }
                },
                totalCostValue: { $sum: "$totalCost" }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    const dailyCostValue = {};
    results.forEach(item => {
        dailyCostValue[item._id] = item.totalCostValue;
    });

    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const formattedDate = date.toISOString().split('T')[0];
        if (!dailyCostValue[formattedDate]) {
            dailyCostValue[formattedDate] = 0;
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, dailyCostValue, "Daily total cost value for the past 30 days retrieved successfully"));
});

// Helper function to process and structure sales data for context
const prepareSalesContext = (salesData) => {
    // Group data by product
    const productSummary = salesData.reduce((acc, sale) => {
        // Handle multi-item sales structure
        if (sale.items && sale.items.length > 0) {
            sale.items.forEach(item => {
                const productId = item.product;
                const productName = item.productName || 'Unknown Product';

                if (!acc[productId]) {
                    acc[productId] = {
                        productName,
                        totalSales: 0,
                        totalProfit: 0,
                        totalQty: 0,
                        totalCost: 0,
                        avgProfitPercent: 0,
                        transactions: 0,
                        priceRange: { min: Infinity, max: 0 }
                    };
                }

                acc[productId].totalSales += item.itemTotal || 0;
                acc[productId].totalProfit += item.itemProfit || 0;
                acc[productId].totalQty += item.qty || 0;
                acc[productId].totalCost += (item.cost * item.qty) || 0;
                acc[productId].transactions += 1;
                acc[productId].avgProfitPercent += item.cost > 0 ? ((item.price - item.cost) / item.cost) * 100 : 0;

                if (item.price < acc[productId].priceRange.min) acc[productId].priceRange.min = item.price;
                if (item.price > acc[productId].priceRange.max) acc[productId].priceRange.max = item.price;
            });
        }

        return acc;
    }, {});

    // Calculate averages
    Object.keys(productSummary).forEach(productId => {
        const product = productSummary[productId];
        product.avgProfitPercent = product.avgProfitPercent / product.transactions;
    });

    // Overall summary
    const overallSummary = {
        totalRevenue: salesData.reduce((sum, sale) => sum + (sale.totalSale || 0), 0),
        totalProfit: salesData.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0),
        totalTransactions: salesData.length,
        totalQuantitySold: salesData.reduce((sum, sale) => {
            if (sale.items && sale.items.length > 0) {
                return sum + sale.items.reduce((itemSum, item) => itemSum + (item.qty || 0), 0);
            }
            return sum;
        }, 0),
        avgProfitMargin: salesData.reduce((sum, sale) => sum + (sale.profitPercent || 0), 0) / salesData.length,
        dateRange: {
            earliest: new Date(Math.min(...salesData.map(sale => new Date(sale.date)))),
            latest: new Date(Math.max(...salesData.map(sale => new Date(sale.date))))
        }
    };

    return {
        productSummary,
        overallSummary,
        rawData: salesData
    };
};

// RAG Query handler
export const querySalesData = async (req, res) => {
    try {
        const { query, timeFilter = 'alltime' } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Query is required"
            });
        }

        // Fetch sales data
        const salesData = await Sales.find({ owner: req.user._id })
            .sort({ createdAt: -1 });

        if (!salesData || salesData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No sales data found"
            });
        }

        // Prepare structured context
        const salesContext = prepareSalesContext(salesData);

        // Create context string for the AI
        const contextString = `
SALES DATA SUMMARY:
===================

OVERALL METRICS:
- Total Revenue: $${salesContext.overallSummary.totalRevenue.toLocaleString()}
- Total Profit: $${salesContext.overallSummary.totalProfit.toLocaleString()}
- Total Transactions: ${salesContext.overallSummary.totalTransactions}
- Total Quantity Sold: ${salesContext.overallSummary.totalQuantitySold}
- Average Profit Margin: ${salesContext.overallSummary.avgProfitMargin.toFixed(2)}%
- Date Range: ${salesContext.overallSummary.dateRange.earliest.toDateString()} to ${salesContext.overallSummary.dateRange.latest.toDateString()}

PRODUCT BREAKDOWN:
${Object.entries(salesContext.productSummary).map(([productId, product]) => `
- ${product.productName} (ID: ${productId}):
  * Total Sales: $${product.totalSales.toLocaleString()}
  * Total Profit: $${product.totalProfit.toLocaleString()}
  * Quantity Sold: ${product.totalQty}
  * Transactions: ${product.transactions}
  * Avg Profit %: ${product.avgProfitPercent.toFixed(2)}%
  * Price Range: $${product.priceRange.min} - $${product.priceRange.max}
`).join('')}

RECENT TRANSACTIONS (Last 10):
${salesData.slice(0, 10).map(sale => `
- Date: ${new Date(sale.date).toDateString()}
  Customer: ${sale.customerName || 'Walk-in'}
  Items: ${sale.items.length}
  Total Sale: $${sale.totalSale || 'N/A'}
  Total Profit: $${sale.totalProfit || 'N/A'} (${sale.profitPercent.toFixed(2)}%)
`).join('')}
    `;

        // Query Groq API
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a sales data analyst. Use the provided sales data to answer questions accurately. 
          Provide specific numbers, insights, and actionable recommendations when possible. 
          Format your response clearly with bullet points or sections when appropriate.
          If asked about trends, calculate percentages and provide comparative analysis.
          Always base your answers strictly on the provided data.`
                },
                {
                    role: "user",
                    content: `Based on this sales data:\n\n${contextString}\n\nQuestion: ${query}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            max_tokens: 1000,
        });

        const aiResponse = completion.choices[0]?.message?.content;

        return res.status(200).json({
            success: true,
            data: {
                query,
                response: aiResponse,
                dataContext: {
                    totalTransactions: salesContext.overallSummary.totalTransactions,
                    totalRevenue: salesContext.overallSummary.totalRevenue,
                    totalProfit: salesContext.overallSummary.totalProfit,
                    dateRange: salesContext.overallSummary.dateRange
                }
            }
        });

    } catch (error) {
        console.error('RAG Query Error:', error);
        return res.status(500).json({
            success: false,
            message: "Error processing query",
            error: error.message
        });
    }
};

// Delete sale with cascading delete to invoice
const deleteSale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Check if this is a multi-item sale (ID format: saleId_productId)
    const isMultiItemSale = id.includes('_');

    let saleId = id;
    if (isMultiItemSale) {
        // Extract the parent sale ID
        saleId = id.split('_')[0];
    }

    // Find the sale
    const sale = await Sales.findOne({ _id: saleId, owner });

    if (!sale) {
        throw new ApiError(404, "Sale not found");
    }

    // Reverse customer balance if sale was unpaid
    if (sale.customer && !sale.paid) {
        const CustomerTransaction = (await import('../models/customerTransaction.model.js')).CustomerTransaction;

        // Get invoice to calculate amount
        let saleAmount = sale.totalSale;
        if (sale.invoice) {
            const invoice = await Invoice.findById(sale.invoice);
            if (invoice) {
                saleAmount = invoice.grandTotal;
            }
        }

        // Reverse customer balance and stats
        await Customer.findByIdAndUpdate(
            sale.customer,
            {
                $inc: {
                    balance: -saleAmount,
                    totalSales: -saleAmount,
                    totalProfit: -(sale.totalProfit || 0)
                }
            }
        );

        // Delete transaction record
        await CustomerTransaction.findOneAndDelete({
            sale: sale._id
        });
    } else if (sale.customer && sale.paid) {
        // If paid, just reverse the stats
        let saleAmount = sale.totalSale;
        if (sale.invoice) {
            const invoice = await Invoice.findById(sale.invoice);
            if (invoice) {
                saleAmount = invoice.grandTotal;
            }
        }

        await Customer.findByIdAndUpdate(
            sale.customer,
            {
                $inc: {
                    totalSales: -saleAmount,
                    totalProfit: -(sale.totalProfit || 0)
                }
            }
        );
    }

    // Delete associated invoice if exists
    if (sale.invoice) {
        await Invoice.findByIdAndDelete(sale.invoice);
    }

    // Delete the sale
    await Sales.findByIdAndDelete(saleId);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Sale and associated invoice deleted successfully"));
});

export {
    addSale,
    getSales,
    getTotalSalesValueOneDay,
    getTotalSalesValueAllTime,
    getTotalSalesValueLast30Days,
    getTotalProfitValueOneDay,
    getTotalProfitValueLast30Days,
    getDailyTotalSalesValuePast30Days,
    getDailyProfitLast30Days,
    getDailyTotalCostValuePast30Days,
    getTotalProfitValueAllTime,
    getTotalCostValueAllTime,
    deleteSale
};