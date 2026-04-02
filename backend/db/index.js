import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Cache the connection for serverless environments (Vercel)
// Reuse the connection across invocations instead of reconnecting every time
let isConnected = false;

const connectDB = async () => {
    if (isConnected && mongoose.connection.readyState === 1) {
        console.log('Reusing existing MongoDB connection');
        return;
    }
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // 10s timeout
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log(`\n MongoDB connected !!! DB_HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        // CRITICAL: Never call process.exit() in a serverless function!
        // It crashes the entire function with FUNCTION_INVOCATION_FAILED.
        // Throw instead so callers can handle it gracefully.
        throw error;
    }
};

export default connectDB;