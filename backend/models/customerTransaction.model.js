import mongoose, { Schema } from "mongoose";

const customerTransactionSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['sale', 'payment', 'credit', 'debit'],
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
    sale: {
        type: Schema.Types.ObjectId,
        ref: 'Sales',
        required: false
    },
    invoice: {
        type: Schema.Types.ObjectId,
        ref: 'Invoice',
        required: false
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    }
}, { timestamps: true });

// Indexes for faster queries
customerTransactionSchema.index({ owner: 1, customer: 1, date: -1 });
customerTransactionSchema.index({ type: 1 });
customerTransactionSchema.index({ date: -1 });

export const CustomerTransaction = mongoose.model('CustomerTransaction', customerTransactionSchema);
