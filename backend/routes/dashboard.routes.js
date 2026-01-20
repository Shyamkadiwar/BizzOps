import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getBusinessHealth,
    getSalesAnalytics,
    getFinancialPerformance,
    getInventoryInsights,
    getCustomerIntelligence,
    getVendorPerformance,
    getOrderFulfillment,
    getDealsPipeline,
    getAppointmentsTasks,
    getStaffPerformance,
    getInvoiceManagement,
    getProductAnalytics
} from "../controllers/dashboard.controller.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Dashboard analytics endpoints
router.route("/business-health").get(getBusinessHealth);
router.route("/sales-analytics").get(getSalesAnalytics);
router.route("/financial-performance").get(getFinancialPerformance);
router.route("/inventory-insights").get(getInventoryInsights);
router.route("/customer-intelligence").get(getCustomerIntelligence);
router.route("/vendor-performance").get(getVendorPerformance);
router.route("/order-fulfillment").get(getOrderFulfillment);
router.route("/deals-pipeline").get(getDealsPipeline);
router.route("/appointments-tasks").get(getAppointmentsTasks);
router.route("/staff-performance").get(getStaffPerformance);
router.route("/invoice-management").get(getInvoiceManagement);
router.route("/product-analytics").get(getProductAnalytics);

export default router;
