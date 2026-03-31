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
// Get unpaid invoices for a customer
const getCustomerUnpaidInvoices = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const Invoice = (await import('../models/invoice.model.js')).Invoice;
    const unpaidInvoices = await Invoice.find({
        owner,
        customer: id,
        paid: false
    }).sort({ date: 1, createdAt: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, { invoices: unpaidInvoices }, "Unpaid invoices retrieved"));
});

const addCustomerPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { invoiceIds, date } = req.body;
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        throw new ApiError(400, "Please select at least one invoice to pay");
    }

    const customer = await Customer.findOne({ _id: id, owner });
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    const Invoice = (await import('../models/invoice.model.js')).Invoice;
    const CustomerTransaction = (await import('../models/customerTransaction.model.js')).CustomerTransaction;

    // Fetch the selected invoices and validate they are unpaid and belong to this customer
    const invoices = await Invoice.find({
        _id: { $in: invoiceIds },
        owner,
        customer: id,
        paid: false
    });

    if (invoices.length !== invoiceIds.length) {
        throw new ApiError(400, "Some selected invoices are invalid, already paid, or don't belong to this customer");
    }

    // Calculate total payment amount from selected invoices
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    if (totalAmount > customer.balance) {
        throw new ApiError(400, "Total invoice amount exceeds customer balance");
    }

    const paidDate = date ? new Date(date) : new Date();

    // Mark each selected invoice as paid with paidDate
    const markedInvoices = [];
    for (const invoice of invoices) {
        invoice.paid = true;
        invoice.paidDate = paidDate;
        await invoice.save();
        markedInvoices.push(invoice.invoiceNumber || invoice._id);
    }

    // Update customer balance
    const updatedCustomer = await Customer.findByIdAndUpdate(
        id,
        { $inc: { balance: -totalAmount } },
        { new: true }
    );

    // Create transaction record
    const invoiceNames = invoices.map(inv => `#${inv.invoiceNumber || inv._id}`).join(', ');
    const transaction = await CustomerTransaction.create({
        owner,
        customer: id,
        type: 'payment',
        amount: -totalAmount,
        balanceAfter: updatedCustomer.balance,
        description: `Payment for invoice(s): ${invoiceNames}`,
        date: paidDate
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {
            customer: updatedCustomer,
            transaction,
            markedPaidInvoices: markedInvoices,
            totalPaid: totalAmount
        }, `${markedInvoices.length} invoice(s) paid successfully. Total: ₹${totalAmount.toLocaleString('en-IN')}`));
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
    getCustomerUnpaidInvoices,
    getCustomerTransactions,
    getCustomerSales
};
