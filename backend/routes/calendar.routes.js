import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getCalendarEvents } from "../controllers/calendar.controller.js";

const router = Router();

router.route('/events').get(verifyJWT, getCalendarEvents);

export default router;
