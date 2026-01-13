import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema({
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
    category: {
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
        type: String,
        required: true,
        trim: true
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
    description: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Index for faster searches
productSchema.index({ name: 'text', category: 'text' });
productSchema.index({ owner: 1, name: 1 });

export const Product = mongoose.model('Product', productSchema);
