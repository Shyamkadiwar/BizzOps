import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPaymentLink, handleWebhook } from "../controllers/payment.controller.js";

const router = Router();

// Create payment link (requires auth)
router.route('/create-link').post(verifyJWT, createPaymentLink);

// Razorpay webhook (NO auth - uses signature verification)
router.route('/webhook').post(handleWebhook);

export default router;
