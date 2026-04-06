import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { sendSubscriptionSuccessEmail } from "../services/email.service.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const createSubscriptionOrder = asyncHandler(async (req, res) => {
    // Uses the Master Razorpay credentials from .env
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 999 INR per month = 99900 paise
    const options = {
        amount: 49900,
        currency: "INR",
        // Razorpay max limit for receipt is 40 characters
        receipt: `sub_${Date.now().toString().slice(-10)}`
    };

    try {
        const order = await razorpay.orders.create(options);
        if (!order) {
            throw new ApiError(500, "Failed to create Razorpay order");
        }
        res.status(200).json(new ApiResponse(200, order, "Order created successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to create Razorpay order");
    }
});

const verifySubscriptionPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(400, "Invalid payment details");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError(400, "Invalid payment signature. Payment failed.");
    }

    // Payment is authentic! Extend user's subscription.
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Add exactly 30 days to the subscription
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    // If they already have an active subscription that ends in the future, just add 30 days to *that*
    // Otherwise, add 30 days from right now.
    let baseDate = Date.now();
    if (user.subscriptionStatus === 'active' && user.subscriptionEndsAt && user.subscriptionEndsAt.getTime() > Date.now()) {
        baseDate = user.subscriptionEndsAt.getTime();
    }

    user.subscriptionStatus = 'active';
    user.subscriptionEndsAt = new Date(baseDate + THIRTY_DAYS);

    // We pass validateBeforeSave: false because older data inside the array models (like activeSessions) might trigger random failures unrelated to this
    await user.save({ validateBeforeSave: false });

    // Try sending email receipt, but don't fail the verification if it errors
    try {
        await sendSubscriptionSuccessEmail(user.email, user.name, user.subscriptionEndsAt);
    } catch (error) {
        console.error("Failed to send subscription success email:", error);
    }

    res.status(200).json(new ApiResponse(200, {
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndsAt: user.subscriptionEndsAt
    }, "Payment verified. Subscription active!"));
});

export {
    createSubscriptionOrder,
    verifySubscriptionPayment
};
