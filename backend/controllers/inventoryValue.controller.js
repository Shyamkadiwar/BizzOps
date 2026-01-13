import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Inventory } from "../models/inventory.model.js";

// Get total inventory value
export const getInventoryValue = asyncHandler(async (req, res) => {
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(400, "User not found");
    }

    const inventoryItems = await Inventory.find({ owner });

    const totalInventoryValue = inventoryItems.reduce((sum, item) => {
        return sum + (item.cost * item.stockRemain);
    }, 0);

    const totalStockValue = inventoryItems.reduce((sum, item) => {
        return sum + (item.salePrice * item.stockRemain);
    }, 0);

    const potentialProfit = totalStockValue - totalInventoryValue;

    return res.status(200).json(
        new ApiResponse(200, {
            totalInventoryValue,
            totalStockValue,
            potentialProfit,
            totalItems: inventoryItems.length,
            totalStock: inventoryItems.reduce((sum, item) => sum + item.stockRemain, 0)
        }, "Inventory value calculated successfully")
    );
});
