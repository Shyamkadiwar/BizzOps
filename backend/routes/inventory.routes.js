import { Router } from "express";
import { addInventoryItem, addStock, deleteInventoryItem, getInventoryItem, removeStock } from "../controllers/inventory.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/add-item').post(verifyJWT, addInventoryItem)
router.route('/get-item').get(verifyJWT, getInventoryItem)
router.route('/add-stock').post(verifyJWT, addStock)
router.route('/remove-stock').post(verifyJWT, removeStock)
router.route('/delete-item').post(verifyJWT, deleteInventoryItem)

export default router