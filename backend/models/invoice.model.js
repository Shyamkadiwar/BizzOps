import mongoose, { Schema } from "mongoose";

const invoiceSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'Sales',
    required: false
  },
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
  customerEmail: {
    type: String,
    required: false,
    trim: true
  },
  customerPhone: {
    type: String,
    required: false,
    trim: true
  },
  customerAddress: {
    type: String,
    required: false,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  items: [
    {
      itemName: { type: String, required: true },
      qty: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
      cost: { type: Number, required: false, min: 0 },
      taxes: [{
        name: { type: String, required: true },
        rate: { type: Number, default: 0, min: 0, max: 100 },
        amount: { type: Number, default: 0, min: 0 }
      }],
      total: { type: Number, required: true, min: 0 }
    }
  ],
  paid: {
    type: Boolean,
    required: true,
    default: false
  },
  subTotal: {
    type: Number,
    required: true,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Pre-save hook to generate invoice number
invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    try {
      // Get user to fetch business name
      const User = mongoose.model('User');
      const user = await User.findById(this.owner);
      const businessName = user?.businessName || 'INV';

      // Find the last invoice for this owner
      const lastInvoice = await this.constructor.findOne({ owner: this.owner })
        .sort({ createdAt: -1 })
        .select('invoiceNumber');

      let nextNumber = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        // Extract number from last invoice (e.g., "BizzOps001" -> 1)
        const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      // Format: BusinessName001, BusinessName002, etc.
      this.invoiceNumber = `${businessName}${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      this.invoiceNumber = `INV${String(Date.now()).slice(-6)}`;
    }
  }
  next();
});

// Index for faster queries
invoiceSchema.index({ owner: 1, date: -1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ paid: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
