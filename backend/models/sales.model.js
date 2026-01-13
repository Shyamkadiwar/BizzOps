import mongoose, { Schema } from 'mongoose';
import { Inventory } from './inventory.model.js';

// Multi-Item Sales Schema
const multiItemSalesSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Inventory',
            required: true
        },
        productName: {
            type: String,
            required: true,
            trim: true
        },
        qty: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        cost: {
            type: Number,
            required: true,
            min: 0
        },
        taxes: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            rate: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            }
        }],
        itemTotal: {
            type: Number,
            required: true
        },
        itemProfit: {
            type: Number,
            required: true
        }
    }],
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },
    customerName: {
        type: String,
        required: false,
        trim: true
    },
    totalSale: {
        type: Number,
        required: true,
        min: 0
    },
    totalCost: {
        type: Number,
        required: true,
        min: 0
    },
    totalProfit: {
        type: Number,
        required: true
    },
    profitPercent: {
        type: Number,
        required: true
    },
    invoice: {
        type: Schema.Types.ObjectId,
        ref: 'Invoice',
        required: false
    },
    paid: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        required: true
    }
}, { timestamps: true });

// Post-save hook to update inventory for all items
multiItemSalesSchema.post('save', async function (doc) {
    try {
        for (const item of doc.items) {
            const inventoryItem = await Inventory.findById(item.product);

            if (!inventoryItem) {
                console.error(`Inventory item not found: ${item.product}`);
                continue;
            }

            inventoryItem.stockRemain -= item.qty;
            await inventoryItem.save();
        }
    } catch (error) {
        console.error('Error updating inventory after multi-item sale:', error);
    }
});

// Index for faster queries
multiItemSalesSchema.index({ owner: 1, date: -1 });
multiItemSalesSchema.index({ customer: 1 });

// Export the unified Sales model (previously MultiItemSales)
export const Sales = mongoose.model('Sales', multiItemSalesSchema);
