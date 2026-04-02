import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";

// Use /tmp in production (Vercel serverless — only /tmp is writable)
// Use ./public/temp in local development
const isProduction = process.env.NODE_ENV === 'production';
const tempDir = isProduction ? os.tmpdir() : "./public/temp";

if (!isProduction && !fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

export const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
