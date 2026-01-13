import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addCustomer,
    getCustomer,
    countCustomers,
    deleteCustomer,
    getCustomerDetails,
    addCustomerPayment,
    getCustomerTransactions,
    getCustomerSales
} from "../controllers/customer.controller.js";

const router = Router()

router.route('/add-customer').post(verifyJWT, addCustomer)
router.route('/get-customer').get(verifyJWT, getCustomer)
router.route('/count-customer').get(verifyJWT, countCustomers)
router.route('/delete-customer/:id').delete(verifyJWT, deleteCustomer)
router.route('/details/:id').get(verifyJWT, getCustomerDetails)
router.route('/payment/:id').post(verifyJWT, addCustomerPayment)
router.route('/transactions/:id').get(verifyJWT, getCustomerTransactions)
router.route('/sales/:id').get(verifyJWT, getCustomerSales)


export default router