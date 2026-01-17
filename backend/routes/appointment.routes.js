import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment
} from "../controllers/appointment.controller.js";

const router = Router();

router.route('/create').post(verifyJWT, createAppointment);
router.route('/get-appointments').get(verifyJWT, getAppointments);
router.route('/:id').get(verifyJWT, getAppointmentById);
router.route('/:id').put(verifyJWT, updateAppointment);
router.route('/:id').delete(verifyJWT, deleteAppointment);

export default router;
