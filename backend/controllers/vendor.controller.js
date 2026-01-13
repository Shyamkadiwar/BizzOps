import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Vendor } from '../models/vendor.model.js';

// Create vendor
const createVendor = asyncHandler(async (req, res) => {
    const { name, email, phone, address, city, state, gstNumber } = req.body;
    const owner = req.user?._id;

    if (!name) {
        throw new ApiError(400, "Vendor name is required");
    }

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ owner, name });
    if (existingVendor) {
        return res
            .status(200)
            .json(new ApiResponse(200, { vendor: existingVendor }, "Vendor already exists"));
    }

    const vendor = await Vendor.create({
        owner,
        name,
        email,
        phone,
        address,
        city,
        state,
        gstNumber
    });

    return res
        .status(201)
        .json(new ApiResponse(201, { vendor }, "Vendor created successfully"));
});

// Get all vendors
const getVendors = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const { page = 1, limit = 100, search } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { owner };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }

    const vendors = await Vendor.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalCount = await Vendor.countDocuments(filter);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            vendors,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit)
            }
        }, "Vendors retrieved successfully"));
});

// Get vendor details
const getVendorDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const vendor = await Vendor.findOne({ _id: id, owner });

    if (!vendor) {
        throw new ApiError(404, "Vendor not found");
    }

    // Get transaction count
    const VendorTransaction = (await import('../models/vendorTransaction.model.js')).VendorTransaction;
    const transactionCount = await VendorTransaction.countDocuments({ vendor: id, owner });

    // Get purchase count (inventory items from this vendor)
    const Inventory = (await import('../models/inventory.model.js')).Inventory;
    const purchaseCount = await Inventory.countDocuments({ vendor: id, owner });

    return res
        .status(200)
        .json(new ApiResponse(200, {
            vendor,
            stats: {
                balance: vendor.balance,
                totalPurchases: vendor.totalPurchases,
                totalPaid: vendor.totalPaid,
                transactionCount,
                purchaseCount
            }
        }, "Vendor details retrieved successfully"));
});

// Add payment to vendor
const addVendorPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, date, description } = req.body;
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!amount || amount <= 0) {
        throw new ApiError(400, "Valid payment amount is required");
    }

    const vendor = await Vendor.findOne({ _id: id, owner });

    if (!vendor) {
        throw new ApiError(404, "Vendor not found");
    }

    if (amount > vendor.balance) {
        throw new ApiError(400, "Payment amount cannot exceed vendor balance");
    }

    // Update vendor balance and totalPaid
    const updatedVendor = await Vendor.findByIdAndUpdate(
        id,
        {
            $inc: {
                balance: -amount,
                totalPaid: amount
            }
        },
        { new: true }
    );

    // Create transaction record
    const VendorTransaction = (await import('../models/vendorTransaction.model.js')).VendorTransaction;
    const transaction = await VendorTransaction.create({
        owner,
        vendor: id,
        type: 'payment',
        amount: -amount,
        balanceAfter: updatedVendor.balance,
        description: description || 'Payment made',
        date: date ? new Date(date) : new Date()
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {
            vendor: updatedVendor,
            transaction
        }, "Payment recorded successfully"));
});

// Get vendor transactions with filters
const getVendorTransactions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const owner = req.user?._id;
    const { page = 1, limit = 10, type, startDate, endDate, minAmount, maxAmount } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { vendor: id, owner };
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

    const VendorTransaction = (await import('../models/vendorTransaction.model.js')).VendorTransaction;

    const transactions = await VendorTransaction.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('inventory', 'item qty cost');

    const totalCount = await VendorTransaction.countDocuments(filter);

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

// Get vendor purchases with filters
const getVendorPurchases = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const owner = req.user?._id;
    const { page = 1, limit = 10, paid, startDate, endDate, minAmount, maxAmount, search } = req.query;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { vendor: id, owner };
    if (paid !== undefined) filter.paid = paid === 'true';
    if (search) filter.item = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
        filter.purchaseAmount = {};
        if (minAmount) filter.purchaseAmount.$gte = parseFloat(minAmount);
        if (maxAmount) filter.purchaseAmount.$lte = parseFloat(maxAmount);
    }

    const Inventory = (await import('../models/inventory.model.js')).Inventory;

    const purchases = await Inventory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalCount = await Inventory.countDocuments(filter);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            purchases,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit)
            }
        }, "Purchases retrieved successfully"));
});

// Delete vendor
const deleteVendor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Check if vendor has any inventory items
    const Inventory = (await import('../models/inventory.model.js')).Inventory;
    const inventoryCount = await Inventory.countDocuments({ vendor: id, owner });

    if (inventoryCount > 0) {
        throw new ApiError(400, "Cannot delete vendor with existing inventory items");
    }

    const vendor = await Vendor.findOneAndDelete({ _id: id, owner });

    if (!vendor) {
        throw new ApiError(404, "Vendor not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Vendor deleted successfully"));
});

export {
    createVendor,
    getVendors,
    getVendorDetails,
    addVendorPayment,
    getVendorTransactions,
    getVendorPurchases,
    deleteVendor
};
