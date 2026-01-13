import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getNote, addNote, deleteNote } from "../controllers/notes.controller.js";

const router = Router()

router.route('/add-notes').post(verifyJWT, addNote)
router.route('/get-notes').get(verifyJWT, getNote)
router.route('/delete-notes').post(verifyJWT, deleteNote)

export default router