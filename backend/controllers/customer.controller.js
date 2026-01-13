import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from '../models/user.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { Customer } from '../models/customer.models.js';

const addCustomer = asyncHandler(async (req, res) => {
    const { name, email, phone, city, address, gstNumber, company, state, pincode, notes } = req.body;
    const owner = req.user?._id;

    if (!name || !email || !phone || !city) {
        throw new ApiError(400, "Name, email, phone, and city are required");
    }
    if (!owner) {
        throw new ApiError(400, "Unauthorized request");
    }

    const customer = await Customer.create({
        owner,
        name,
        email,
        phone,
        city,
        address,
        gstNumber,
        company,
        state,
        pincode,
        notes
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { customer }, "Customer added successfully"));
});

const getCustomer = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!owner) {
        throw new ApiError(400, "Unauthorized request");
    }

    const customers = await Customer.find({ owner })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalCount = await Customer.countDocuments({ owner });

    if (!customers) {
        throw new ApiError(200, "No customer found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {
            customers,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                limit
            }
        }, "Customers retrieved successfully"));
});

// New function to count customers
const countCustomers = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    if (!owner) {
        throw new ApiError(400, "Unauthorized request");
    }

    const customerCount = await Customer.countDocuments({ owner });

    return res
        .status(200)
        .json(new ApiResponse(200, { count: customerCount }, "Customer count retrieved successfully"));
});

// Delete customer
const deleteCustomer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const customer = await Customer.findOneAndDelete({ _id: id, owner });

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Customer deleted successfully"));
});

// Get customer details with balance, stats, and history
const getCustomerDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const customer = await Customer.findOne({ _id: id, owner });

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    // Get transaction count
    const CustomerTransaction = (await import('../models/customerTransaction.model.js')).CustomerTransaction;
    const transactionCount = await CustomerTransaction.countDocuments({ customer: id, owner });

    // Get sales count
    const Sales = (await import('../models/sales.model.js')).Sales;
    const salesCount = await Sales.countDocuments({ customer: id, owner });

    return res
        .status(200)
        .json(new ApiResponse(200, {
            customer,
            stats: {
                balance: customer.balance,
                totalSales: customer.totalSales,
                totalProfit: customer.totalProfit,
                transactionCount,
                salesCount
            }
        }, "Customer details retrieved successfully"));
});

// Add payment from customer
const addCustomerPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, date, description } = req.body;
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!amount || amount <= 0) {
        throw new ApiError(400, "Valid payment amount is required");
    }

    const customer = await Customer.findOne({ _id: id, owner });

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    if (amount > customer.balance) {
        throw new ApiError(400, "Payment amount cannot exceed customer balance");
    }

    // Update customer balance
    const updatedCustomer = await Customer.findByIdAndUpdate(
        id,
        { $inc: { balance: -amount } },
        { new: true }
    );

    // Create transaction record
    const CustomerTransaction = (await import('../models/customerTransaction.model.js')).CustomerTransaction;
    const transaction = await CustomerTransaction.create({
        owner,
        customer: id,
        type: 'payment',
        amount: -amount,
        balanceAfter: updatedCustomer.balance,
        description: description || 'Payment received',
        date: date ? new Date(date) : new Date()
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {
            customer: updatedCustomer,
            transaction
        }, "Payment recorded successfully"));
});

// Get customer transactions with filters
const getCustomerTransactions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const owner = req.user?._id;
    const { page = 1, limit = 10, type, startDate, endDate, minAmount, maxAmount } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { customer: id, owner };
    if (type) filter.type = type;
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
        filter.amount = {};
        if (minAmount) filter.amount.$gte = parseFloat(minAmount);
        if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    const CustomerTransaction = (await import('../models/customerTransaction.model.js')).CustomerTransaction;

    const transactions = await CustomerTransaction.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('sale', 'productName qty sale')
        .populate('invoice', 'invoiceNumber');

    const totalCount = await CustomerTransaction.countDocuments(filter);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            transactions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit)
            }
        }, "Transactions retrieved successfully"));
});

// Get customer sales with filters
const getCustomerSales = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const owner = req.user?._id;
    const { page = 1, limit = 10, paid, startDate, endDate, minAmount, maxAmount } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { customer: id, owner };
    if (paid !== undefined) filter.paid = paid === 'true';
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }

    const Sales = (await import('../models/sales.model.js')).Sales;

    // Query unified sales model
    const allSales = await Sales.find(filter)
        .populate('invoice', 'invoiceNumber grandTotal')
        .sort({ date: -1 })
        .lean();

    // Transform sales to flatten items for display
    const transformedSales = [];
    allSales.forEach(sale => {
        // Each sale now has an items array
        sale.items.forEach(item => {
            transformedSales.push({
                _id: `${sale._id}_${item.product}`,
                date: sale.date,
                productName: item.productName,
                qty: item.qty,
                sale: item.itemTotal,
                profit: item.itemProfit,
                paid: sale.paid,
                invoice: sale.invoice,
                createdAt: sale.createdAt,
                updatedAt: sale.updatedAt
            });
        });
    });

    // Apply amount filter
    let filteredSales = transformedSales;
    if (minAmount || maxAmount) {
        filteredSales = transformedSales.filter(sale => {
            const amount = sale.sale;
            if (minAmount && amount < parseFloat(minAmount)) return false;
            if (maxAmount && amount > parseFloat(maxAmount)) return false;
            return true;
        });
    }

    // Apply pagination
    const totalCount = filteredSales.length;
    const paginatedSales = filteredSales.slice(skip, skip + parseInt(limit));

    return res
        .status(200)
        .json(new ApiResponse(200, {
            sales: paginatedSales,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit)
            }
        }, "Sales retrieved successfully"));
});

export {
    addCustomer,
    getCustomer,
    countCustomers,
    deleteCustomer,
    getCustomerDetails,
    addCustomerPayment,
    getCustomerTransactions,
    getCustomerSales
};
