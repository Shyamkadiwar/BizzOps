import mongoose, { Schema } from 'mongoose';

const inventorySchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: false
    },
    item: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    warehouse: {
        type: String,
        required: true,
        trim: true
    },
    cost: {
        type: Number,
        required: true,
        min: 0
    },
    salePrice: {
        type: Number,
        required: true,
        min: 0
    },
    vendor: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: false
    },
    vendorName: {
        type: String,
        trim: true
    },
    paid: {
        type: Boolean,
        default: false
    },
    purchaseAmount: {
        type: Number,
        default: 0,
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
    stockRemain: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    date: {
        type: Date,
        required: true
    }
}, { timestamps: true });

// Virtual field for total inventory value
inventorySchema.virtual('totalValue').get(function () {
    return this.cost * this.stockRemain;
});

// Ensure virtuals are included in JSON
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

// Index for faster searches
inventorySchema.index({ owner: 1, item: 1 });
inventorySchema.index({ warehouse: 1 });

export const Inventory = mongoose.model('Inventory', inventorySchema);

