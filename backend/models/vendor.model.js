import mongoose, { Schema } from "mongoose";

const vendorSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    // Balance tracking fields
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPurchases: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPaid: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true });

// Indexes for faster searches
vendorSchema.index({ owner: 1, name: 1 });
vendorSchema.index({ email: 1 });

export const Vendor = mongoose.model('Vendor', vendorSchema);
