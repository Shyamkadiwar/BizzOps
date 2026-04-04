import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Inventory } from "../models/inventory.model.js";

const addInventoryItem = asyncHandler(async (req, res) => {
  let { product, item, category, warehouse, cost, salePrice, vendor, taxes, stockRemain, date, paid } = req.body;
  const owner = req.user?._id;

  if (!item || !category || !warehouse || cost === undefined || salePrice === undefined || !vendor || !stockRemain || !date) {
    throw new ApiError(400, "All required fields must be provided");
  }
  if (!owner) {
    throw new ApiError(400, "User not found");
  }

  // Handle vendor - either string (name) or ObjectId
  const Vendor = (await import('../models/vendor.model.js')).Vendor;
  let vendorId = vendor;
  let vendorDoc = null;

  if (typeof vendor === 'string') {
    // Check if it's a valid ObjectId string
    const mongoose = await import('mongoose');
    if (mongoose.default.Types.ObjectId.isValid(vendor) && vendor.length === 24) {
      // Vendor is an ObjectId - fetch vendor document
      try {
        vendorDoc = await Vendor.findOne({ _id: vendor, owner });
        if (!vendorDoc) {
          throw new ApiError(400, "Invalid vendor provided");
        }
        vendorId = vendorDoc._id;
      } catch (error) {
        throw new ApiError(400, "Invalid vendor provided");
      }
    } else {
      // Vendor is a name string - auto-create if doesn't exist
      let existingVendor = await Vendor.findOne({ owner, name: vendor });

      if (!existingVendor) {
        // Create new vendor
        try {
          existingVendor = await Vendor.create({
            owner,
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
        vendorDoc = existingVendor;
      }
    }
  }

  // Calculate purchase amount
  const purchaseAmount = parseFloat(cost) * parseInt(stockRemain);
  const isPaid = paid === true || paid === 'true';

  // Check if item already exists in the same warehouse
  const existingItem = await Inventory.findOne({
    owner,
    item,
    category,
    warehouse
  });

  if (existingItem) {
    // Update existing item's stock and other details
    existingItem.stockRemain += parseInt(stockRemain);
    existingItem.cost = parseFloat(cost);
    existingItem.salePrice = parseFloat(salePrice);
    existingItem.vendor = vendorId;
    existingItem.taxes = taxes || [];
    existingItem.date = new Date(date);
    existingItem.paid = isPaid;
    existingItem.purchaseAmount = purchaseAmount;

    // Update product reference if provided
    if (product) {
      existingItem.product = product;
    }

    await existingItem.save();

    // Update vendor aggregates and create transaction
    if (vendorId) {
      const VendorTransaction = (await import('../models/vendorTransaction.model.js')).VendorTransaction;

      // Fetch vendor if not already fetched
      if (!vendorDoc) {
        vendorDoc = await Vendor.findById(vendorId);
      }

      if (vendorDoc) {
        // Update vendor aggregates
        const updateFields = {
          $inc: {
            totalPurchases: purchaseAmount
          }
        };

        if (isPaid) {
          updateFields.$inc.totalPaid = purchaseAmount;
        } else {
          updateFields.$inc.balance = purchaseAmount;
        }

        const updatedVendor = await Vendor.findByIdAndUpdate(
          vendorId,
          updateFields,
          { new: true }
        );

        // Create vendor transaction
        if (updatedVendor) {
          await VendorTransaction.create({
            owner,
            vendor: vendorId,
            type: 'purchase',
            amount: purchaseAmount,
            balanceAfter: updatedVendor.balance,
            description: `Purchase: ${item} (Qty: ${stockRemain})`,
            inventory: existingItem._id,
            date: new Date(date)
          });
        }
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, existingItem, `Stock updated successfully. New stock: ${existingItem.stockRemain}`));
  }

  // Auto-create product if not provided
  if (!product) {
    const Product = (await import('../models/product.model.js')).Product;
    try {
      const newProduct = await Product.create({
        owner,
        name: item,
        category,
        cost,
        salePrice,
        vendor: vendorId,
        taxes: taxes || [],
        description: `Auto-created from inventory`
      });
      product = newProduct._id;
    } catch (error) {
      console.log('Could not auto-create product:', error.message);
    }
  }

  // Create new inventory item
  const addedItem = await Inventory.create({
    owner,
    product: product || null,
    item,
    category,
    warehouse,
    cost,
    salePrice,
    vendor: vendorId,
    taxes: taxes || [],
    stockRemain,
    paid: isPaid,
    purchaseAmount,
    date: new Date(date)
  });

  // Update vendor aggregates and create transaction
  if (vendorId) {
    const VendorTransaction = (await import('../models/vendorTransaction.model.js')).VendorTransaction;

    // Fetch vendor if not already fetched
    if (!vendorDoc) {
      vendorDoc = await Vendor.findById(vendorId);
    }

    if (vendorDoc) {
      // Update vendor aggregates
      const updateFields = {
        $inc: {
          totalPurchases: purchaseAmount
        }
      };

      if (isPaid) {
        updateFields.$inc.totalPaid = purchaseAmount;
      } else {
        updateFields.$inc.balance = purchaseAmount;
      }

      const updatedVendor = await Vendor.findByIdAndUpdate(
        vendorId,
        updateFields,
        { new: true }
      );

      // Create vendor transaction
      if (updatedVendor) {
        await VendorTransaction.create({
          owner,
          vendor: vendorId,
          type: 'purchase',
          amount: purchaseAmount,
          balanceAfter: updatedVendor.balance,
          description: `Purchase: ${item} (Qty: ${stockRemain})`,
          inventory: addedItem._id,
          date: new Date(date)
        });
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, addedItem, "Item added to inventory successfully"));
});

const getInventoryItem = asyncHandler(async (req, res) => {
  const owner = req.user?._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!owner) {
    throw new ApiError(400, "User not found");
  }

  const inventoryItems = await Inventory.find({ owner })
    .populate('product')
    .populate('vendor', 'name phone email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Inventory.countDocuments({ owner });

  // Calculate total inventory value from ALL items
  const allItems = await Inventory.find({ owner });

  console.log('Total items for value calculation:', allItems.length);

  let totalInventoryValue = 0;
  allItems.forEach(item => {
    const cost = parseFloat(item.cost) || 0;
    const stock = parseInt(item.stockRemain) || 0;
    const itemValue = cost * stock;
    totalInventoryValue += itemValue;

    if (itemValue > 0) {
      console.log(`Item: ${item.item}, Cost: ${cost}, Stock: ${stock}, Value: ${itemValue}`);
    }
  });

  console.log('Calculated Total Inventory Value:', totalInventoryValue);

  return res
    .status(200)
    .json(new ApiResponse(200, {
      inventoryItems,
      totalInventoryValue,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    }, "Inventory items fetched successfully"));
});

const addStock = asyncHandler(async (req, res) => {
  let { product, newQty } = req.body;  // product is a id of product
  newQty = Number(newQty);
  const owner = req.user?._id;

  if (!owner) {
    throw new ApiError(400, "User not found");
  }

  if (!product || !newQty || newQty <= 0) {
    throw new ApiError(400, "Invalid product ID or quantity");
  }

  const inventoryItem = await Inventory.findOne({ _id: product, owner });

  if (!inventoryItem) {
    throw new ApiError(404, "Inventory item not found or you do not own this item");
  }

  inventoryItem.stockRemain += newQty;
  await inventoryItem.save();

  // Update vendor balance (adding stock = purchase from vendor)
  if (inventoryItem.vendor) {
    const Vendor = (await import('../models/vendor.model.js')).Vendor;
    const VendorTransaction = (await import('../models/vendorTransaction.model.js')).VendorTransaction;

    const purchaseAmount = (parseFloat(inventoryItem.cost) || 0) * newQty;

    if (purchaseAmount > 0) {
      const updatedVendor = await Vendor.findByIdAndUpdate(
        inventoryItem.vendor,
        {
          $inc: {
            balance: purchaseAmount,
            totalPurchases: purchaseAmount
          }
        },
        { new: true }
      );

      if (updatedVendor) {
        await VendorTransaction.create({
          owner,
          vendor: inventoryItem.vendor,
          type: 'purchase',
          amount: purchaseAmount,
          balanceAfter: updatedVendor.balance,
          description: `Stock added: ${inventoryItem.item} (Qty: ${newQty})`,
          inventory: inventoryItem._id,
          date: new Date()
        });
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, inventoryItem, "Stock updated successfully"));
});

const removeStock = asyncHandler(async (req, res) => {
  let { product, newQty } = req.body;  // product is a id of product
  newQty = Number(newQty);
  const owner = req.user?._id;

  if (!owner) {
    throw new ApiError(400, "User not found");
  }

  if (!product || !newQty || newQty <= 0) {
    throw new ApiError(400, "Invalid product ID or quantity");
  }

  const inventoryItem = await Inventory.findOne({ _id: product, owner });

  if (!inventoryItem) {
    throw new ApiError(404, "Inventory item not found or you do not own this item");
  }

  inventoryItem.stockRemain -= newQty;
  await inventoryItem.save();

  // Update vendor balance (removing stock = return/reversal)
  if (inventoryItem.vendor) {
    const Vendor = (await import('../models/vendor.model.js')).Vendor;
    const VendorTransaction = (await import('../models/vendorTransaction.model.js')).VendorTransaction;

    const returnAmount = (parseFloat(inventoryItem.cost) || 0) * newQty;

    if (returnAmount > 0) {
      // Fetch current vendor to clamp values
      const vendorDoc = await Vendor.findById(inventoryItem.vendor);

      if (vendorDoc) {
        // Clamp decrements so balance and totalPurchases don't go below 0
        const balanceDecrement = Math.min(returnAmount, vendorDoc.balance);
        const purchaseDecrement = Math.min(returnAmount, vendorDoc.totalPurchases);

        const updatedVendor = await Vendor.findByIdAndUpdate(
          inventoryItem.vendor,
          {
            $inc: {
              balance: -balanceDecrement,
              totalPurchases: -purchaseDecrement
            }
          },
          { new: true }
        );

        if (updatedVendor) {
          await VendorTransaction.create({
            owner,
            vendor: inventoryItem.vendor,
            type: 'debit',
            amount: -returnAmount,
            balanceAfter: updatedVendor.balance,
            description: `Stock removed/returned: ${inventoryItem.item} (Qty: ${newQty})`,
            inventory: inventoryItem._id,
            date: new Date()
          });
        }
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, inventoryItem, "Stock updated successfully"));
});

const deleteInventoryItem = asyncHandler(async (req, res) => {
  const { product } = req.body;  // product is the id of the inventory item
  const owner = req.user?._id;

  if (!owner) {
    throw new ApiError(400, "User not found");
  }

  if (!product) {
    throw new ApiError(400, "Product ID is required");
  }

  const inventoryItem = await Inventory.deleteOne({ _id: product, owner });

  // if (!inventoryItem) {
  //     throw new ApiError(404, "Inventory item not found or you do not own this item");
  // }

  // await inventoryItem.remove();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Inventory item deleted successfully"));
});












export {
  addInventoryItem,
  getInventoryItem,
  addStock,
  removeStock,
  deleteInventoryItem
}