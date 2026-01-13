import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createVendor,
    getVendors,
    getVendorDetails,
    addVendorPayment,
    getVendorTransactions,
    getVendorPurchases,
    deleteVendor
} from "../controllers/vendor.controller.js";

const router = Router();

router.route('/create').post(verifyJWT, createVendor);
router.route('/list').get(verifyJWT, getVendors);
router.route('/details/:id').get(verifyJWT, getVendorDetails);
router.route('/payment/:id').post(verifyJWT, addVendorPayment);
router.route('/transactions/:id').get(verifyJWT, getVendorTransactions);
router.route('/purchases/:id').get(verifyJWT, getVendorPurchases);
router.route('/delete/:id').delete(verifyJWT, deleteVendor);

export default router;
