import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/orders.model.js";

const addOrder = asyncHandler(async (req, res) => {
    const { item, qty, price, dateToDilivery, profitInPercent } = req.body;
    const owner = req.user?._id;
    if (!item || !qty || !price || !dateToDilivery || !profitInPercent) {
        throw new ApiError(400, "All fields are required");
    }
    if (!owner) {
        throw new ApiError(400, "Unauthorized request");
    }

    const totalSale = price * qty;
    const totalProfit = (totalSale * profitInPercent) / 100;
    const totalCost = totalSale - totalProfit;

    const order = await Order.create({
        owner,
        item,
        qty,
        price,
        profitInPercent,
        dateToDilivery,
        sale: totalSale,
        profit: totalProfit,
        cost: totalCost        
    });

    return res.status(201).json(new ApiResponse(201, order, "Order added successfully"));
});

const getOrders = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    if (!ownerId) {
        throw new ApiError(400, "Unauthorized Request");
    }

    const orders = await Order.find({ owner: ownerId });
    if (!orders) {
        throw new ApiError(400, "Error while fetching orders");
    }

    return res.status(200).json(new ApiResponse(200, orders, "Orders retrieved successfully"));
});

const getPendingOrder = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    if (!ownerId) {
        throw new ApiError(400, "Unauthorized Request");
    }
    const pendingCount = await Order.countDocuments({ owner: ownerId, done: false });
    
    return res.status(200).json(new ApiResponse(200, { pendingCount }, "Pending orders counted successfully"));
});


const countTotalOrders = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    if (!ownerId) {
        throw new ApiError(400, "Unauthorized Request");
    }

    const totalOrders = await Order.countDocuments({ owner: ownerId });

    return res.status(200).json(new ApiResponse(200, { totalOrders }, "Total orders counted successfully"));
});

const markDone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const order = await Order.findOne({ _id: id, owner });

    if (!order) {
        throw new ApiError(404, "Order not found"); 
    }

    order.done = !order.done; // Toggle the paid status
    await order.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { order }, `Order marked as ${order.done ? "Delivered" : "Pending"} successfully`));
});




import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Make sure to add this to your .env file
});

// Helper function to process and structure order data for context
const prepareOrderContext = (orderData) => {
  // Group data by item
  const itemSummary = orderData.reduce((acc, order) => {
    const itemName = order.item;
    
    if (!acc[itemName]) {
      acc[itemName] = {
        itemName,
        totalOrders: 0,
        totalSales: 0,
        totalProfit: 0,
        totalCost: 0,
        totalQty: 0,
        avgProfitPercent: 0,
        completedOrders: 0,
        pendingOrders: 0,
        priceRange: { min: Infinity, max: 0 },
        deliveryDates: []
      };
    }
    
    acc[itemName].totalOrders += 1;
    acc[itemName].totalSales += order.sale || 0;
    acc[itemName].totalProfit += order.profit || 0;
    acc[itemName].totalCost += order.cost || 0;
    acc[itemName].totalQty += order.qty || 0;
    acc[itemName].avgProfitPercent += order.profitInPercent || 0;
    
    if (order.done) {
      acc[itemName].completedOrders += 1;
    } else {
      acc[itemName].pendingOrders += 1;
    }
    
    if (order.price < acc[itemName].priceRange.min) acc[itemName].priceRange.min = order.price;
    if (order.price > acc[itemName].priceRange.max) acc[itemName].priceRange.max = order.price;
    
    acc[itemName].deliveryDates.push(new Date(order.dateToDilivery));
    
    return acc;
  }, {});

  // Calculate averages for each item
  Object.keys(itemSummary).forEach(itemName => {
    const item = itemSummary[itemName];
    item.avgProfitPercent = item.avgProfitPercent / item.totalOrders;
    item.avgOrderValue = item.totalSales / item.totalOrders;
    item.completionRate = (item.completedOrders / item.totalOrders) * 100;
  });

  // Overall summary
  const overallSummary = {
    totalOrders: orderData.length,
    totalRevenue: orderData.reduce((sum, order) => sum + (order.sale || 0), 0),
    totalProfit: orderData.reduce((sum, order) => sum + (order.profit || 0), 0),
    totalCost: orderData.reduce((sum, order) => sum + (order.cost || 0), 0),
    totalQuantity: orderData.reduce((sum, order) => sum + (order.qty || 0), 0),
    completedOrders: orderData.filter(order => order.done).length,
    pendingOrders: orderData.filter(order => !order.done).length,
    avgProfitMargin: orderData.reduce((sum, order) => sum + (order.profitInPercent || 0), 0) / orderData.length,
    avgOrderValue: orderData.reduce((sum, order) => sum + (order.sale || 0), 0) / orderData.length,
    dateRange: {
      earliest: new Date(Math.min(...orderData.map(order => new Date(order.createdAt)))),
      latest: new Date(Math.max(...orderData.map(order => new Date(order.createdAt)))),
      nextDelivery: new Date(Math.min(...orderData.filter(order => !order.done).map(order => new Date(order.dateToDilivery)))),
      lastDelivery: new Date(Math.max(...orderData.filter(order => order.done).map(order => new Date(order.dateToDilivery))))
    },
    completionRate: (orderData.filter(order => order.done).length / orderData.length) * 100
  };

  // Upcoming deliveries (next 7 days)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDeliveries = orderData.filter(order => 
    !order.done && 
    new Date(order.dateToDilivery) >= now && 
    new Date(order.dateToDilivery) <= nextWeek
  ).sort((a, b) => new Date(a.dateToDilivery) - new Date(b.dateToDilivery));

  // Overdue orders
  const overdueOrders = orderData.filter(order => 
    !order.done && new Date(order.dateToDilivery) < now
  ).sort((a, b) => new Date(a.dateToDilivery) - new Date(b.dateToDilivery));

  return {
    itemSummary,
    overallSummary,
    upcomingDeliveries,
    overdueOrders,
    rawData: orderData
  };
};

// RAG Query handler for orders
const queryOrderData = asyncHandler(async (req, res) => {
  const { query, timeFilter = 'alltime' } = req.body;
  
  if (!query) {
    throw new ApiError(400, "Query is required");
  }

  const ownerId = req.user?._id;
  if (!ownerId) {
    throw new ApiError(401, "Unauthorized request");
  }

  // Fetch order data
  let dateFilter = {};
  const now = new Date();
  
  switch (timeFilter) {
    case 'today':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      };
      break;
    case 'week':
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      dateFilter = { createdAt: { $gte: weekStart } };
      break;
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: monthStart } };
      break;
    case 'quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      dateFilter = { createdAt: { $gte: quarterStart } };
      break;
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      dateFilter = { createdAt: { $gte: yearStart } };
      break;
    default:
      dateFilter = {};
  }

  const orderData = await Order.find({ 
    owner: ownerId,
    ...dateFilter
  }).sort({ createdAt: -1 });

  if (!orderData || orderData.length === 0) {
    throw new ApiError(404, "No order data found");
  }

  // Prepare structured context
  const orderContext = prepareOrderContext(orderData);
  
  // Create context string for the AI
  const contextString = `
ORDER DATA SUMMARY:
===================

OVERALL METRICS:
- Total Orders: ${orderContext.overallSummary.totalOrders}
- Total Revenue: $${orderContext.overallSummary.totalRevenue.toLocaleString()}
- Total Profit: $${orderContext.overallSummary.totalProfit.toLocaleString()}
- Total Cost: $${orderContext.overallSummary.totalCost.toLocaleString()}
- Total Quantity: ${orderContext.overallSummary.totalQuantity}
- Average Order Value: $${orderContext.overallSummary.avgOrderValue.toFixed(2)}
- Average Profit Margin: ${orderContext.overallSummary.avgProfitMargin.toFixed(2)}%
- Completed Orders: ${orderContext.overallSummary.completedOrders}
- Pending Orders: ${orderContext.overallSummary.pendingOrders}
- Completion Rate: ${orderContext.overallSummary.completionRate.toFixed(2)}%
- Date Range: ${orderContext.overallSummary.dateRange.earliest.toDateString()} to ${orderContext.overallSummary.dateRange.latest.toDateString()}

ITEM BREAKDOWN:
${Object.entries(orderContext.itemSummary).map(([itemName, item]) => `
- ${item.itemName}:
  * Total Orders: ${item.totalOrders}
  * Total Sales: $${item.totalSales.toLocaleString()}
  * Total Profit: $${item.totalProfit.toLocaleString()}
  * Total Quantity: ${item.totalQty}
  * Average Profit %: ${item.avgProfitPercent.toFixed(2)}%
  * Average Order Value: $${item.avgOrderValue.toFixed(2)}
  * Completed: ${item.completedOrders} | Pending: ${item.pendingOrders}
  * Completion Rate: ${item.completionRate.toFixed(2)}%
  * Price Range: $${item.priceRange.min} - $${item.priceRange.max}
`).join('')}

UPCOMING DELIVERIES (Next 7 Days):
${orderContext.upcomingDeliveries.length > 0 ? 
  orderContext.upcomingDeliveries.slice(0, 10).map(order => `
- Item: ${order.item}
  Delivery Date: ${new Date(order.dateToDilivery).toDateString()}
  Quantity: ${order.qty}
  Order Value: $${order.sale}
  Status: ${order.done ? 'Completed' : 'Pending'}
`).join('') : 'No upcoming deliveries in the next 7 days'}

OVERDUE ORDERS:
${orderContext.overdueOrders.length > 0 ? 
  orderContext.overdueOrders.slice(0, 10).map(order => `
- Item: ${order.item}
  Due Date: ${new Date(order.dateToDilivery).toDateString()}
  Days Overdue: ${Math.floor((new Date() - new Date(order.dateToDilivery)) / (1000 * 60 * 60 * 24))}
  Quantity: ${order.qty}
  Order Value: $${order.sale}
`).join('') : 'No overdue orders'}

RECENT ORDERS (Last 10):
${orderData.slice(0, 10).map(order => `
- Date Created: ${new Date(order.createdAt).toDateString()}
  Item: ${order.item}
  Quantity: ${order.qty}
  Unit Price: $${order.price}
  Total Sale: $${order.sale}
  Profit: $${order.profit} (${order.profitInPercent}%)
  Delivery Date: ${new Date(order.dateToDilivery).toDateString()}
  Status: ${order.done ? 'Completed' : 'Pending'}
`).join('')}
  `;

  try {
    // Query Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an order management analyst. Use the provided order data to answer questions accurately. 
          Provide specific numbers, insights, and actionable recommendations when possible. 
          Format your response clearly with bullet points or sections when appropriate.
          If asked about trends, calculate percentages and provide comparative analysis.
          Always base your answers strictly on the provided data.
          Focus on delivery schedules, order completion rates, profitability analysis, and inventory insights.
          Highlight urgent matters like overdue orders or upcoming deliveries when relevant.`
        },
        {
          role: "user",
          content: `Based on this order data:\n\n${contextString}\n\nQuestion: ${query}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    return res.status(200).json(
      new ApiResponse(200, {
        query,
        response: aiResponse,
        dataContext: {
          totalOrders: orderContext.overallSummary.totalOrders,
          totalRevenue: orderContext.overallSummary.totalRevenue,
          totalProfit: orderContext.overallSummary.totalProfit,
          completedOrders: orderContext.overallSummary.completedOrders,
          pendingOrders: orderContext.overallSummary.pendingOrders,
          completionRate: orderContext.overallSummary.completionRate,
          upcomingDeliveries: orderContext.upcomingDeliveries.length,
          overdueOrders: orderContext.overdueOrders.length,
          dateRange: orderContext.overallSummary.dateRange
        }
      }, "Query processed successfully")
    );

  } catch (error) {
    console.error('RAG Query Error:', error);
    throw new ApiError(500, "Error processing query: " + error.message);
  }
});

export { queryOrderData };


export {
    addOrder,
    getOrders,
    getPendingOrder,
    countTotalOrders,
    markDone
};
