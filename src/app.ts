import { errorHandler, notFoundHandler } from "#middleware/error.middleware.js";
import { httpLogger } from "#middleware/HttpLogger.middleware.js";
import appRoutes from "#routes/index.js";
import { securityConfig } from "#types/auth.types.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";

const app: Express = express();

// --- MIDDLEWARE ---
// Security middleware
app.use(helmet(securityConfig.helmet));
app.use(cors(securityConfig.cors));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Request logging middlware
app.use(httpLogger);

// --- ROUTES ---
app.use("/api", appRoutes);

// --- ERROR MIDDLEWARE ---
// 404 handler for undefined routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
