import mongoose, { Schema } from "mongoose";

const customerSchema = new mongoose.Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
  gstNumber: {
    type: String,
    required: false,
    trim: true,
    uppercase: true
  },
  company: {
    type: String,
    required: false,
    trim: true
  },
  state: {
    type: String,
    required: false,
    trim: true
  },
  pincode: {
    type: String,
    required: false,
    trim: true
  },
  notes: {
    type: String,
    required: false,
    trim: true
  },
  // Balance tracking fields
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSales: {
    type: Number,
    default: 0,
    min: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Index for faster searches
customerSchema.index({ owner: 1, name: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
