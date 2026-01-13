import { Router } from "express";
import {
    changePassword,
    getCurrentUserDetails,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    getActiveSessions,
    revokeSession,
    revokeAllSessions,
    getSessionStatistics,
    logoutFromAllDevices
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authLimiter, sessionLimiter } from "../middlewares/rateLimiter.js";

const router = Router()

router.route('/register').post(authLimiter, registerUser)
router.route('/login').post(authLimiter, loginUser)

// secured routes
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT, changePassword)
router.route('/get-details').get(verifyJWT, getCurrentUserDetails)
router.route('/update-account').post(verifyJWT, updateAccountDetails)

// session management routes
router.route('/sessions').get(verifyJWT, sessionLimiter, getActiveSessions)
router.route('/sessions/:sessionId').delete(verifyJWT, sessionLimiter, revokeSession)
router.route('/sessions/revoke-all').post(verifyJWT, sessionLimiter, revokeAllSessions)
router.route('/sessions/statistics').get(verifyJWT, getSessionStatistics)
router.route('/logout-all-devices').post(verifyJWT, sessionLimiter, logoutFromAllDevices)

export default router