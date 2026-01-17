import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['Created', 'Status Changed', 'Updated', 'Note Added', 'Contact Made']
    },
    description: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const dealSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['New', 'Prospect', 'Proposal', 'Won', 'Lost'],
        default: 'New'
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    value: {
        type: Number,
        default: 0
    },
    probability: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    expectedCloseDate: {
        type: Date
    },
    actualCloseDate: {
        type: Date
    },
    involvedPersons: [{
        type: String,
        trim: true
    }],
    notes: {
        type: String
    },
    activities: [activitySchema],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export const Deal = mongoose.model("Deal", dealSchema);
