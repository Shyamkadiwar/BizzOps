import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from '../models/user.model.js';
import jwt, { decode } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { parseUserAgent, getClientIP } from '../utils/deviceDetection.js';
import { revokeOtherDeviceSessions, revokeSpecificSession, getSessionStatistics as getSessionStats, revokeAllUserSessions } from '../utils/sessionCleanup.js';

const generateAccessRefreshToken = async (userId, sessionId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Find the session and update its refresh token
        const sessionIndex = user.activeSessions.findIndex(session => session.sessionId === sessionId);
        if (sessionIndex !== -1) {
            user.activeSessions[sessionIndex].refreshToken = refreshToken;
            user.activeSessions[sessionIndex].lastActiveAt = new Date();
        }

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
        address
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

    // Create new session
    const sessionId = uuidv4();
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceInfo = parseUserAgent(userAgent);

    // Generate tokens directly without session lookup
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Add session to user's active sessions
    const newSession = {
        sessionId,
        refreshToken,
        ipAddress,
        userAgent,
        deviceInfo,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        isActive: true
    };

    user.activeSessions.push(newSession);
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(user._id).select("-password -activeSessions.refreshToken");

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
        .cookie('sessionId', sessionId, options)
        .json(new ApiResponse(200, {
            user: loggedInUser,
            message: "Login successful"
            // Don't send tokens in response body when using cookies
        }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    const sessionId = req.cookies?.sessionId || req.header('X-Session-ID');

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $pull: {
                activeSessions: { sessionId: sessionId }
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .clearCookie('sessionId', options)
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

        // Find the session with this refresh token
        const activeSession = user.activeSessions.find(
            session => session.refreshToken === incomingRefreshToken && session.isActive
        );

        if (!activeSession) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessRefreshToken(user._id, activeSession.sessionId);

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
        res.clearCookie('sessionId', clearOptions);

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
    const { name, email, businessName, phoneNo, address } = req.body
    if (!name || !email || !businessName) {
        throw new ApiError(400, "All field are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                name,
                email,
                businessName,
                phoneNo,
                address
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User updated successful"))
})

const getActiveSessions = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("activeSessions");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Hide refresh tokens and mark current session
    const currentSessionId = req.cookies?.sessionId || req.header('X-Session-ID') || req.header('sessionId');

    const activeSessions = user.activeSessions
        .map(session => ({
            sessionId: session.sessionId,
            ipAddress: session.ipAddress,
            deviceInfo: session.deviceInfo,
            createdAt: session.createdAt,
            lastActiveAt: session.lastActiveAt,
            isCurrent: session.sessionId === currentSessionId
        }));

    return res
        .status(200)
        .json(new ApiResponse(200, activeSessions, "Active sessions fetched successfully"));
});

const revokeSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const currentSessionId = req.cookies?.sessionId || req.header('X-Session-ID');

    // Validate sessionId parameter
    if (!sessionId) {
        throw new ApiError(400, "Session ID is required");
    }

    if (sessionId === currentSessionId) {
        throw new ApiError(400, "Cannot revoke current session. Please use logout instead.");
    }

    // Use the utility function to revoke specific session
    const result = await revokeSpecificSession(req.user._id, sessionId);

    if (!result.success) {
        throw new ApiError(500, result.error || "Failed to revoke session");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Session revoked successfully"));
});

const revokeAllSessions = asyncHandler(async (req, res) => {
    const currentSessionId = req.cookies?.sessionId || req.header('X-Session-ID');

    if (!currentSessionId) {
        throw new ApiError(400, "Current session ID is required");
    }

    // Use the utility function to revoke other device sessions
    const result = await revokeOtherDeviceSessions(req.user._id, currentSessionId);

    if (!result.success) {
        throw new ApiError(500, result.error || "Failed to revoke sessions");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {
            remainingSessions: result.remainingSessions
        }, "All other sessions revoked successfully"));
});

// Get session statistics for admin/monitoring purposes
const getSessionStatistics = asyncHandler(async (req, res) => {
    const stats = await getSessionStats();

    if (stats.error) {
        throw new ApiError(500, stats.error);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Session statistics retrieved successfully"));
});

// Logout from all devices (including current session)
const logoutFromAllDevices = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        secure: true
    };

    // Use the utility function to revoke all sessions
    const result = await revokeAllUserSessions(req.user._id);

    if (!result.success) {
        throw new ApiError(500, result.error || "Failed to logout from all devices");
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .clearCookie("sessionId", options)
        .json(new ApiResponse(200, {}, "Logged out from all devices successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUserDetails,
    updateAccountDetails,
    getActiveSessions,
    revokeSession,
    revokeAllSessions,
    getSessionStatistics,
    logoutFromAllDevices,
};