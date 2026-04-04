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





export {
    addOrder,
    getOrders,
    getPendingOrder,
    countTotalOrders,
    markDone
};
