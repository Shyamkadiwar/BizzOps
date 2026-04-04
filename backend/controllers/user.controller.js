import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendContactEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { User } from '../models/user.model.js';
import crypto from 'crypto';
import jwt, { decode } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const generateAccessRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, businessName, phoneNo, address } = req.body;
    // Check required string fields
    if ([name, email, password, businessName, address].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }
    // Check phoneNo separately since it's a number
    if (!phoneNo) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User already exists with this email");
    }

    const user = await User.create({
        name,
        email,
        password,
        businessName,
        phoneNo,
        address,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and Password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate tokens directly
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Sanitize user for response
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Updated cookie options for better security and cross-origin support
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only secure in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // For cross-origin in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
    };

    const refreshTokenOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
    };

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, refreshTokenOptions)
        .json(new ApiResponse(200, {
            user: loggedInUser,
            message: "Login successful"
            // Don't send tokens in response body when using cookies
        }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, "User Logged Out"))
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token not found");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessRefreshToken(user._id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        };

        const refreshTokenOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, refreshTokenOptions)
            .json(new ApiResponse(200, { message: "Access token refreshed" }, "Access token refreshed successfully"));
    } catch (error) {
        // Clear cookies on error
        const clearOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        };

        res.clearCookie('accessToken', clearOptions);
        res.clearCookie('refreshToken', clearOptions);

        throw new ApiError(401, error.message || "Invalid refresh token");
    }
});


const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid password")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: true });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfull"))
});

const getCurrentUserDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("-password")
    return res
        .status(200)
        .json(new ApiResponse(200, user, "User details fetched Successful"))
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name, email, businessName, phoneNo, address, gstNumber, website } = req.body
    if (!name || !email || !businessName) {
        throw new ApiError(400, "All fields are required")
    }

    let businessLogoUrl = undefined;
    
    // Check if businessLogo file is uploaded
    const localFilePath = req.file?.path;
    if (localFilePath) {
        const uploadedResponse = await uploadOnCloudinary(localFilePath);
        if (uploadedResponse) {
            businessLogoUrl = uploadedResponse.url;
        }
    }

    const updateFields = {
        name,
        email,
        businessName,
        phoneNo,
        address,
        gstNumber,
        website
    };

    if (businessLogoUrl) {
        updateFields.businessLogo = businessLogoUrl;
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updateFields
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User updated successful"))
});

// Get Razorpay and other payment settings
const getPaymentSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("razorpayKeyId razorpayKeySecret razorpayWebhookSecret");
    if (!user) throw new ApiError(404, "User not found");

    // Mask the secrets to avoid sending them in plain text
    const maskSecret = (secret) => {
        if (!secret) return "";
        if (secret.length <= 8) return "••••••••";
        return "••••••••" + secret.slice(-4);
    };

    return res.status(200).json(new ApiResponse(200, {
        razorpayKeyId: user.razorpayKeyId || "",
        razorpayKeySecret: maskSecret(user.razorpayKeySecret),
        razorpayWebhookSecret: maskSecret(user.razorpayWebhookSecret)
    }, "Payment settings fetched successfully"));
});

// Update Razorpay payment settings
const updatePaymentSettings = asyncHandler(async (req, res) => {
    const { razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret } = req.body;
    
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(404, "User not found");

    // Only update if provided. If they send masked version (••••••••), we ignore it to prevent saving masked versions.
    if (razorpayKeyId !== undefined) {
        user.razorpayKeyId = razorpayKeyId;
    }
    if (razorpayKeySecret !== undefined && !razorpayKeySecret.startsWith("••••••••")) {
        user.razorpayKeySecret = razorpayKeySecret;
    }
    if (razorpayWebhookSecret !== undefined && !razorpayWebhookSecret.startsWith("••••••••")) {
        user.razorpayWebhookSecret = razorpayWebhookSecret;
    }

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Payment settings updated successfully"));
});

// Get Gemini API key setting (masked)
const getGeminiSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select('geminiApiKey');
    if (!user) throw new ApiError(404, 'User not found');

    const maskKey = (key) => {
        if (!key) return '';
        if (key.length <= 8) return '••••••••';
        return key.slice(0, 8) + '••••••••' + key.slice(-4);
    };

    return res.status(200).json(new ApiResponse(200, {
        geminiApiKey: user.geminiApiKey ? maskKey(user.geminiApiKey) : ''
    }, 'Gemini settings fetched successfully'));
});

// Update Gemini API key
const updateGeminiSettings = asyncHandler(async (req, res) => {
    const { geminiApiKey } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(404, 'User not found');

    // Don't save if it's the masked version
    if (geminiApiKey !== undefined && !geminiApiKey.includes('••••••••')) {
        user.geminiApiKey = geminiApiKey.trim();
    }

    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, {}, 'Gemini API key updated successfully'));
});

// Support Contact Message
const sendContactMessage = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
        throw new ApiError(400, "All fields are required");
    }

    try {
        await sendContactEmail(name, email, subject, message);
        return res.status(200).json(new ApiResponse(200, {}, "Message sent successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to send message: " + error.message);
    }
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        // Return 200 even if not found to prevent email enumeration attacks
        return res.status(200).json(new ApiResponse(200, {}, "If an account with that email exists, we have sent a password reset link."));
    }

    const resetToken = user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Assuming the frontend runs on the same domain or use env var
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
    const frontendUrl = process.env.FRONTEND_URL || `${protocol}://${req.get("host")}`;
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
        await sendPasswordResetEmail(user.email, user.name, resetUrl);
        return res.status(200).json(new ApiResponse(200, {}, "If an account with that email exists, we have sent a password reset link."));
    } catch (error) {
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, "There was an error sending the password reset email. Please try again later.");
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    // Hash token to compare with DB
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Token is invalid or has expired");
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Password updated successfully. You can now login."));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUserDetails,
    updateAccountDetails,
    getPaymentSettings,
    updatePaymentSettings,
    getGeminiSettings,
    updateGeminiSettings,
    sendContactMessage,
    forgotPassword,
    resetPassword
};