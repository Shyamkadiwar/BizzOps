import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getTaskStats
} from "../controllers/task.controller.js";

const router = Router();

router.route('/create').post(verifyJWT, createTask);
router.route('/get-tasks').get(verifyJWT, getTasks);
router.route('/stats').get(verifyJWT, getTaskStats);
router.route('/:id').get(verifyJWT, getTaskById);
router.route('/:id').put(verifyJWT, updateTask);
router.route('/:id/status').put(verifyJWT, updateTaskStatus);
router.route('/:id').delete(verifyJWT, deleteTask);

export default router;
