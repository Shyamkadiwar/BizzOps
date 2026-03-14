import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new product
export const createProduct = asyncHandler(async (req, res) => {
    const { name, category, cost, salePrice, vendor, taxes, description } = req.body;

    if (!name || !category || cost === undefined || salePrice === undefined || !vendor) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Resolve vendor - either ObjectId string or name string
    let vendorId = vendor;

    if (typeof vendor === 'string') {
        const Vendor = (await import('../models/vendor.model.js')).Vendor;
        const mongoose = (await import('mongoose')).default;

        if (mongoose.Types.ObjectId.isValid(vendor) && vendor.length === 24) {
            // Vendor is an ObjectId - look up by _id
            const vendorDoc = await Vendor.findOne({ _id: vendor, owner: req.user._id });
            if (!vendorDoc) {
                throw new ApiError(400, "Invalid vendor provided");
            }
            vendorId = vendorDoc._id;
        } else {
            // Vendor is a name string - find or auto-create
            let existingVendor = await Vendor.findOne({ owner: req.user._id, name: vendor });

            if (!existingVendor) {
                try {
                    existingVendor = await Vendor.create({
                        owner: req.user._id,
                        name: vendor,
                        email: `${vendor.toLowerCase().replace(/\s+/g, '')}@vendor.com`,
                        phone: '0000000000'
                    });
                } catch (error) {
                    console.log('Could not create vendor:', error.message);
                }
            }

            if (existingVendor) {
                vendorId = existingVendor._id;
            }
        }
    }

    const product = await Product.create({
        owner: req.user._id,
        name,
        category,
        cost,
        salePrice,
        vendor: vendorId,
        taxes: taxes || [],
        description
    });

    return res.status(201).json(
        new ApiResponse(201, product, "Product created successfully")
    );
});

// Get all products with pagination
export const getProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ owner: req.user._id })
        .populate('vendor', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalCount = await Product.countDocuments({ owner: req.user._id });

    return res.status(200).json(
        new ApiResponse(200, {
            products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                limit
            }
        }, "Products fetched successfully")
    );
});

// Get single product by ID
export const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, owner: req.user._id }).populate('vendor', 'name email phone');

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(
        new ApiResponse(200, product, "Product fetched successfully")
    );
});

// Update product
export const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, category, cost, salePrice, vendor, taxes, description } = req.body;

    const product = await Product.findOne({ _id: id, owner: req.user._id });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (name) product.name = name;
    if (category) product.category = category;
    if (cost !== undefined) product.cost = cost;
    if (salePrice !== undefined) product.salePrice = salePrice;

    // Resolve vendor — could be ObjectId or name string
    if (vendor) {
        const Vendor = (await import('../models/vendor.model.js')).Vendor;
        const mongoose = (await import('mongoose')).default;

        if (typeof vendor === 'string' && mongoose.Types.ObjectId.isValid(vendor) && vendor.length === 24) {
            product.vendor = vendor;
        } else if (typeof vendor === 'string') {
            let existingVendor = await Vendor.findOne({ owner: req.user._id, name: vendor });
            if (!existingVendor) {
                try {
                    existingVendor = await Vendor.create({
                        owner: req.user._id,
                        name: vendor,
                        email: `${vendor.toLowerCase().replace(/\s+/g, '')}@vendor.com`,
                        phone: '0000000000'
                    });
                } catch (error) {
                    console.log('Could not create vendor:', error.message);
                }
            }
            if (existingVendor) {
                product.vendor = existingVendor._id;
            }
        } else {
            product.vendor = vendor;
        }
    }
    if (taxes) product.taxes = taxes;
    if (description !== undefined) product.description = description;

    await product.save();

    return res.status(200).json(
        new ApiResponse(200, product, "Product updated successfully")
    );
});

// Delete product
export const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findOneAndDelete({ _id: id, owner: req.user._id });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Product deleted successfully")
    );
});

// Search products by name or category
export const searchProducts = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query) {
        throw new ApiError(400, "Search query is required");
    }

    const products = await Product.find({
        owner: req.user._id,
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
        ]
    }).limit(20);

    return res.status(200).json(
        new ApiResponse(200, products, "Products found")
    );
});

// Get products by vendor
export const getProductsByVendor = asyncHandler(async (req, res) => {
    const { vendorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const products = await Product.find({ owner: req.user._id, vendor: vendorId })
        .populate('vendor', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalCount = await Product.countDocuments({ owner: req.user._id, vendor: vendorId });

    return res.status(200).json(
        new ApiResponse(200, {
            products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                limit
            }
        }, "Vendor products fetched successfully")
    );
});
