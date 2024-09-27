import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addExpense, getExpense, getAllTimeExpense, getLast30DaysExpense, getOneDayExpense } from "../controllers/expense.controller.js";

const router = Router()

router.route('/add-expense').post(verifyJWT,addExpense)
router.route('/get-expense').get(verifyJWT,getExpense)
router.route('/get-oneday-expense').get(verifyJWT,getOneDayExpense)
router.route('/get-last30day-expense').get(verifyJWT,getLast30DaysExpense)
router.route('/get-alltime-expense').get(verifyJWT,getAllTimeExpense)

export default router