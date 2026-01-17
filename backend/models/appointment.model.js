import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        trim: true
    },
    attendees: [{
        type: String,
        trim: true
    }],
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    type: {
        type: String,
        enum: ['Meeting', 'Call', 'Site Visit', 'Other'],
        default: 'Meeting'
    },
    reminder: {
        type: Number, // minutes before
        default: 15
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Validation to ensure endTime is after startTime
appointmentSchema.pre('save', function (next) {
    if (this.endTime <= this.startTime) {
        next(new Error('End time must be after start time'));
    } else {
        next();
    }
});

export const Appointment = mongoose.model("Appointment", appointmentSchema);
