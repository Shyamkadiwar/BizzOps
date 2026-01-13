import mongoose, { Schema } from "mongoose";

const vendorTransactionSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    vendor: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['purchase', 'payment', 'credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    inventory: {
        type: Schema.Types.ObjectId,
        ref: 'Inventory',
        required: false
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    }
}, { timestamps: true });

// Indexes for faster queries
vendorTransactionSchema.index({ owner: 1, vendor: 1, date: -1 });
vendorTransactionSchema.index({ type: 1 });
vendorTransactionSchema.index({ date: -1 });

export const VendorTransaction = mongoose.model('VendorTransaction', vendorTransactionSchema);
