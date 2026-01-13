import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createProduct, deleteProduct, getProductById, getProducts, searchProducts, updateProduct } from "../controllers/product.controller.js";

const router = Router();

router.route('/add-product').post(verifyJWT, createProduct);
router.route('/get-products').get(verifyJWT, getProducts);
router.route('/get-product/:id').get(verifyJWT, getProductById);
router.route('/update-product/:id').put(verifyJWT, updateProduct);
router.route('/delete-product/:id').delete(verifyJWT, deleteProduct);
router.route('/search-products').get(verifyJWT, searchProducts);

export default router;
