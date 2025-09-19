import { checkDatabaseHealth } from "#config/prisma.js";
import { asyncHandler } from "#middleware/error.middleware.js";
import { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

class HealthController {
	healthCheck: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
		const dbHealthy = await checkDatabaseHealth();
		
		res.status(StatusCodes.OK).json({
			database: dbHealthy ? "healthy" : "unhealthy",
			status: "ok",
			timestamp: new Date().toISOString(),
		});
	});
}

export const healthController = new HealthController();