import { Router } from "express";
import {
    changePassword,
    getCurrentUserDetails,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    getPaymentSettings,
    updatePaymentSettings,
    getGeminiSettings,
    updateGeminiSettings,
    sendContactMessage,
    forgotPassword,
    resetPassword
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route('/register').post(authLimiter, registerUser)
router.route('/login').post(authLimiter, loginUser)
router.route('/forgot-password').post(authLimiter, forgotPassword)
router.route('/reset-password/:token').post(resetPassword)
router.route('/contact').post(sendContactMessage)

// secured routes
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT, changePassword)
router.route('/get-details').get(verifyJWT, getCurrentUserDetails)
router.route('/update-account').post(verifyJWT, upload.single("businessLogo"), updateAccountDetails)
router.route('/payment-settings').get(verifyJWT, getPaymentSettings).post(verifyJWT, updatePaymentSettings)
router.route('/gemini-settings').get(verifyJWT, getGeminiSettings).post(verifyJWT, updateGeminiSettings)

export default router