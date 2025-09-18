import { env } from "#config/env.js";
import { checkDatabaseHealth, disconnectDatabase } from "#config/prisma.js";
import logger from "#utils/logger.js";

import app from "./app.js";

// Start the server with comprehensive error handling and database verification
const startServer = async () => {
	try {
		// Verify database connection before starting server
		const dbHealthy = await checkDatabaseHealth();
		if (!dbHealthy) {
			logger.fatal("Database connection failed. Server startup aborted.");
			process.exit(1);
		}

		const server = app.listen(env.PORT, () => {
			logger.info({
				database: "connected",
				environment: env.NODE_ENV,
				message: "Authentication server started successfully",
				pid: process.pid,
				port: env.PORT,
			});
		});

		// Graceful shutdown handling - critical for production auth services
		// This ensures in-flight authentication requests complete before shutdown
		const gracefulShutdown = (signal: string) => {
			logger.info(`Received ${signal}, shutting down gracefully`);

			server.close(() => {
				logger.info("HTTP server closed");

				// Disconnect from database
				void disconnectDatabase();

				logger.info("Server shutdown complete");
				process.exit(0);
			});

			// Force shutdown after 30 seconds
			setTimeout(() => {
				logger.error("Forced shutdown after timeout");
				process.exit(1);
			}, 30000);
		};

		process.on("SIGTERM", () => { gracefulShutdown("SIGTERM"); });
		process.on("SIGINT", () => { gracefulShutdown("SIGINT"); });
	} catch (error) {
		logger.fatal(
			{
				error: error instanceof Error ? error.message : "Unknown error",
			},
			"Failed to start server"
		);
		process.exit(1);
	}
};

// Start the server
void startServer();

// Handle uncaught exceptions - essential for auth service stability
process.on("uncaughtException", (error) => {
	logger.fatal(
		{
			error: {
				message: error.message,
				name: error.name,
				stack: error.stack,
			},
		},
		"Uncaught exception occurred"
	);

	// In development, don't exit immediately to help debug
	if (env.NODE_ENV === "development") {
		logger.error("Continuing in development mode for debugging");
		return;
	}

	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	logger.fatal({ promise, reason }, "Unhandled rejection occurred");
	process.exit(1);
});
