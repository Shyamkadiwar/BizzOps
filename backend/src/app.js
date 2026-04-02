import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from '../db/index.js';

// Load environment variables
dotenv.config();

const app = express();

import { handleWebhook } from "../controllers/payment.controller.js";
app.post("/api/v1/payment/webhook",
  express.raw({ type: '*/*' }),  // Accept any content type as raw buffer
  handleWebhook
);
// GET endpoint to test if webhook route is reachable on deployed server
app.get("/api/v1/payment/webhook", (req, res) => {
  res.status(200).json({ status: 'active', message: 'Razorpay webhook endpoint is reachable', timestamp: new Date().toISOString() });
});

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.replace(/["']/g, '').trim().replace(/\/$/, ''))
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Handle preflight OPTIONS requests for ALL routes BEFORE other middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Lazy DB connection middleware — ensures DB is connected on every cold start
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('DB connection failed on request:', error);
    res.status(503).json({ message: 'Database unavailable. Please try again.' });
  }
});

// Middleware
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "../routes/user.routes.js";
import inventoryRouter from "../routes/inventory.routes.js";
import salesRouter from "../routes/sales.routes.js";
import customerRouter from "../routes/customer.routes.js";
import invoiceRouter from "../routes/invoice.routes.js";
import staffRouter from '../routes/staff.routes.js';
import expenseRouter from "../routes/expense.routes.js";
import notesRouter from "../routes/notes.routes.js";
import ordersRouter from "../routes/orders.routes.js";
import productRouter from "../routes/product.routes.js";
import excelRouter from "../routes/excel.routes.js";
import vendorRouter from "../routes/vendor.routes.js";
import dealRouter from "../routes/deal.routes.js";
import taskRouter from "../routes/task.routes.js";
import appointmentRouter from "../routes/appointment.routes.js";
import calendarRouter from "../routes/calendar.routes.js";
import dashboardRouter from "../routes/dashboard.routes.js";
import paymentRouter from "../routes/payment.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/inventory", inventoryRouter);
app.use("/api/v1/sales", salesRouter);
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/invoice", invoiceRouter);
app.use("/api/v1/staff", staffRouter);
app.use("/api/v1/expense", expenseRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/notes", notesRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/excel", excelRouter);
app.use("/api/v1/vendor", vendorRouter);
app.use("/api/v1/deals", dealRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/calendar", calendarRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/payment", paymentRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Something went wrong!'
  });
});

export { app };