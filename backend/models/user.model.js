import mongoose, { Schema } from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

export const User = mongoose.model('User', userSchema) 
