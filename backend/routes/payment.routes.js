import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPaymentLink } from "../controllers/payment.controller.js";

const router = Router();

// Create payment link (requires auth)
router.route('/create-link').post(verifyJWT, createPaymentLink);

// NOTE: Webhook route is registered directly in app.js (before express.json())
// because it needs raw body for Razorpay signature verification.

export default router;
