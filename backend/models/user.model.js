import mongoose, { Schema } from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    businessName: {
        type: String,
        required: true
    },
    phoneNo: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    gstNumber: {
        type: String,
        default: ""
    },
    website: {
        type: String,
        default: ""
    },
    businessLogo: {
        type: String,
        default: ""
    },
    razorpayKeyId: {
        type: String,
        default: ""
    },
    razorpayKeySecret: {
        type: String,
        default: ""
    },
    razorpayWebhookSecret: {
        type: String,
        default: ""
    },
    geminiApiKey: {
        type: String,
        default: ""
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    activeSessions: [{
        sessionId: {
            type: String,
            required: true
        },
        refreshToken: {
            type: String,
            required: true
        },
        ipAddress: {
            type: String,
            required: true
        },
        userAgent: {
            type: String,
            required: true
        },
        deviceInfo: {
            browser: String,
            os: String,
            device: String,
            deviceType: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        lastActiveAt: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }]
}, { timestamps: true })


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.createResetPasswordToken = function () {
    // Generate an unhashed random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash it and store in the database
    this.forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
        
    // Token expires in 15 minutes
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;
    
    return resetToken;
}

export const User = mongoose.model('User', userSchema)  
