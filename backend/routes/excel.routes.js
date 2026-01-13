import { Router } from "express";
import multer from "multer";
import path from "path";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    importInventory,
    importCustomers,
    importExpenses,
    exportInventory,
    exportSales,
    exportCustomers,
    exportExpenses,
    downloadTemplate
} from "../controllers/excelImport.controller.js";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        if (ext !== '.xlsx' && ext !== '.xls') {
            return cb(new Error('Only Excel files are allowed'));
        }
        cb(null, true);
    }
});

// Import routes
router.post('/import/inventory', verifyJWT, upload.single('file'), importInventory);
router.post('/import/customers', verifyJWT, upload.single('file'), importCustomers);
router.post('/import/expenses', verifyJWT, upload.single('file'), importExpenses);

// Export routes
router.get('/export/inventory', verifyJWT, exportInventory);
router.get('/export/sales', verifyJWT, exportSales);
router.get('/export/customers', verifyJWT, exportCustomers);
router.get('/export/expenses', verifyJWT, exportExpenses);

// Template download route
router.get('/template/:type', downloadTemplate);

export default router;
