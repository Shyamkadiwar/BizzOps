import { Router } from "express";
import {
    createSubscriptionOrder,
    verifySubscriptionPayment
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// These endpoints require the user to be logged in (verifyJWT)
router.route('/create-order').post(verifyJWT, createSubscriptionOrder);
router.route('/verify-payment').post(verifyJWT, verifySubscriptionPayment);

export default router;