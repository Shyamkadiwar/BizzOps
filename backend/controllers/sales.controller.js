import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Sales } from "../models/sales.model.js";
import { Inventory } from "../models/inventory.model.js";

const addSale = asyncHandler(async (req, res) => {
    const { product, price, profitInPercent, qty, date } = req.body;
    const owner = req.user?._id;

    if (!product || !price || !profitInPercent || !qty || !date) {
        throw new ApiError(400, "All fields are required");
    }

    const inventoryItem = await Inventory.findById(product);
    if (!inventoryItem) {
        throw new ApiError(404, "Product not found in inventory");
    }

    if (inventoryItem.stockRemain < qty) {
        throw new ApiError(400, "Not enough stock available");
    }

    const totalSale = (price * qty);
    const totalProfit = (totalSale * profitInPercent) / 100;
    const totalCost = totalSale - totalProfit;

    const newSale = await Sales.create({
        owner,
        product,
        productName: inventoryItem.item,
        price,
        profitInPercent,
        qty,
        sale: totalSale,
        profit: totalProfit,
        cost: totalCost,
        date: new Date(date)
    });

    return res
        .status(201)
        .json(new ApiResponse(201, newSale, "Sale added successfully"));
});

const getSales = asyncHandler(async(req,res)=>{
    const { timeFilter } = req.params; 
    const ownerId = req.user?._id;

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

    const sales = await Sales.find(filter);
    return res
    .status(200)
    .json(new ApiResponse(200,sales,"sales get successfull"));
})

const getTotalSalesValueOneDay = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await Sales.aggregate([
        { $match: { owner: ownerId, date: { $gte: startOfToday } } },
        { 
            $group: {
                _id: null,
                totalSalesValue: { $sum: "$sale" },
            },
        },
    ]);

    console.log(result)

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
                totalSalesValue: { $sum: "$sale" }
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
                totalSalesValue: { $sum: "$sale" }
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
                totalProfitValue: { $sum: "$profit" }, 
            },
        },
    ]);

    const totalProfitValue = result.length > 0 ? result[0].totalProfitValue : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, { totalProfitValue }, "Total profit value for one day retrieved successfully"));
});

const getTotalProfitValueLast30Days = asyncHandler(async(req, res)=>{
    const ownerId = req.user?._id
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    
    const result = await Sales.aggregate([
        {$match:{owner:ownerId, date:{$gte:thirtyDaysAgo}}},
        {
            $group:{
                _id:null,
                totalProfitValue : {$sum:"$profit"}
            }
        }
    ])

    const totalProfitValue = result.length > 0 ? result[0].totalProfitValue : 0 

    return res
    .status(200)
    .json(new ApiResponse(200,{totalProfitValue},"Total profit value for last 30 days retrived successfull"))
})

const getTotalProfitValueAllTime = asyncHandler(async(req, res)=>{
    const ownerId = req.user?._id
    const result = await Sales.aggregate([
        {$match:{owner:ownerId}},
        {
            $group:{
                _id:null,
                totalProfitValue : {$sum:"$profit"}
            }
        }
    ])

    const totalProfitValue = result.length > 0 ? result[0].totalProfitValue : 0 

    return res
    .status(200)
    .json(new ApiResponse(200,{totalProfitValue},"Total profit  retrived successfull"))
})
const getTotalCostValueAllTime = asyncHandler(async(req, res)=>{
    const ownerId = req.user?._id
    const result = await Sales.aggregate([
        {$match:{owner:ownerId}},
        {
            $group:{
                _id:null,
                totalCostValue : {$sum:"$cost"}
            }
        }
    ])

    const totalCostValue = result.length > 0 ? result[0].totalCostValue : 0 

    return res
    .status(200)
    .json(new ApiResponse(200,{totalCostValue},"Total cost retrived successfull"))
})

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
                totalSalesValue: { $sum: "$sale" } 
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
                totalProfitValue: { $sum: "$profit" } 
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
                totalCostValue: { $sum: "$cost" } 
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


import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Make sure to add this to your .env file
});

// Helper function to process and structure sales data for context
const prepareSalesContext = (salesData) => {
  // Group data by product
  const productSummary = salesData.reduce((acc, sale) => {
    const productId = sale.product;
    const productName = sale.productName || 'Unknown Product';
    
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
    
    acc[productId].totalSales += sale.sale || 0;
    acc[productId].totalProfit += sale.profit || 0;
    acc[productId].totalQty += sale.qty || 0;
    acc[productId].totalCost += sale.cost || 0;
    acc[productId].transactions += 1;
    acc[productId].avgProfitPercent += sale.profitInPercent || 0;
    
    if (sale.price < acc[productId].priceRange.min) acc[productId].priceRange.min = sale.price;
    if (sale.price > acc[productId].priceRange.max) acc[productId].priceRange.max = sale.price;
    
    return acc;
  }, {});

  // Calculate averages
  Object.keys(productSummary).forEach(productId => {
    const product = productSummary[productId];
    product.avgProfitPercent = product.avgProfitPercent / product.transactions;
  });

  // Overall summary
  const overallSummary = {
    totalRevenue: salesData.reduce((sum, sale) => sum + (sale.sale || 0), 0),
    totalProfit: salesData.reduce((sum, sale) => sum + (sale.profit || 0), 0),
    totalTransactions: salesData.length,
    totalQuantitySold: salesData.reduce((sum, sale) => sum + (sale.qty || 0), 0),
    avgProfitMargin: salesData.reduce((sum, sale) => sum + (sale.profitInPercent || 0), 0) / salesData.length,
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

    // Fetch sales data (reuse your existing getSales logic)
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
  Product: ${sale.productName || 'Unknown'}
  Price: $${sale.price}
  Quantity: ${sale.qty}
  Sale: $${sale.sale || 'N/A'}
  Profit: $${sale.profit || 'N/A'} (${sale.profitInPercent}%)
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
    getTotalCostValueAllTime
};