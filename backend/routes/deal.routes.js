import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createDeal,
    getDeals,
    getDealById,
    updateDeal,
    updateDealStatus,
    deleteDeal,
    getDealStats
} from "../controllers/deal.controller.js";

const router = Router();

router.route('/create').post(verifyJWT, createDeal);
router.route('/get-deals').get(verifyJWT, getDeals);
router.route('/stats').get(verifyJWT, getDealStats);
router.route('/:id').get(verifyJWT, getDealById);
router.route('/:id').put(verifyJWT, updateDeal);
router.route('/:id/status').put(verifyJWT, updateDealStatus);
router.route('/:id').delete(verifyJWT, deleteDeal);

export default router;
