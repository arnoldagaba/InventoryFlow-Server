import { swaggerSpec } from "#config/swagger.js";
import { errorHandler, notFoundHandler } from "#middleware/error.middleware.js";
import { httpLogger } from "#middleware/request.middleware.js";
import appRoutes from "#routes/index.js";
import { securityConfig } from "#types/auth.types.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

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

// --- DOCUMENTATION ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- ROUTES ---
app.get("/", (req, res) => {
	res.json({
		message: "InventoryFlow API Server",
		version: "1.0.0",
		docs: "/api-docs",
		api: "/api"
	});
});

app.use("/api", appRoutes);

// --- ERROR MIDDLEWARE ---
// 404 handler for undefined routes
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

export default app;
