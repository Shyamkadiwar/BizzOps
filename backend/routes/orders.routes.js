import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addOrder, getOrders, getPendingOrder, countTotalOrders, markDone, queryOrderData } from "../controllers/orders.controller.js";

const router = Router()

router.route('/add-order').post(verifyJWT, addOrder)
router.route('/get-order').get(verifyJWT, getOrders)
router.route('/get-pending-order').get(verifyJWT, getPendingOrder)
router.route('/count-order').get(verifyJWT, countTotalOrders)
router.put('/order/:id/markDone', verifyJWT, markDone);

router.route('/query').post(verifyJWT, queryOrderData);

export default router