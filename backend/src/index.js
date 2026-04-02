import dotenv from 'dotenv';
import connectDB from '../db/index.js';
import { app } from './app.js';

// Load .env for local development (Vercel injects env vars automatically in production)
dotenv.config({
    path: './.env'
});

// Initiate DB connection (non-blocking for serverless).
// connectDB() caches the connection, so subsequent invocations reuse it.
connectDB().catch((error) => {
    console.error("MONGODB connection failed....", error);
    // Do NOT process.exit() here — that crashes the serverless function!
});

// Only bind to a port in local/non-serverless development.
// Vercel manages its own HTTP server; calling app.listen() is unnecessary there.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
        console.log(`Server is running at port ${PORT}`);
    });
}

// Export the express app for Vercel Serverless Functions
export default app;