import type { NextFunction, Request, Response } from "express";

import { env } from "#config/env.js";
import { AppError } from "#errors/AppError.js";
import logger from "#utils/logger.js";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";

interface ErrorResponse {
	error: {
		details?: unknown;
		message: string;
		stack?: string | string[];
		statusCode: number;
	};
}

export const errorHandler = (
	err: Error,
	req: Request,
	res: Response<ErrorResponse>,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_next: NextFunction
): void => {
	let error = err;

	// Handle Zod validation errors
	if (error instanceof ZodError) {
		const message =
			error.issues.length === 1
				? error.issues[0].message
				: error.issues
						.map((e) => {
							const path = e.path.length > 0 ? `${e.path.join(".")}: ` : "";
							return `${path}${e.message}`;
						})
						.join(", ");
		error = new AppError(`Validation error: ${message}`, StatusCodes.BAD_REQUEST);
	}

	// Handle Prisma errors
	if (error.name === "PrismaClientKnownRequestError") {
		error = handlePrismaError(error);
	}

	// Default to AppError if not already
	if (!(error instanceof AppError)) {
		error = new AppError("Internal server error", StatusCodes.INTERNAL_SERVER_ERROR);
	}

	const appError = error as AppError;

	// Log error with clear context
	logger.error(
		{
			errorType: appError.constructor.name,
			originalError: err.name !== appError.name ? err.name : undefined,
			request: {
				ip: req.ip,
				method: req.method,
				path: req.url,
				userAgent: req.get("User-Agent"),
			},
			...(env.NODE_ENV === "development" && { stack: appError.stack }),
		},
		`[${String(appError.statusCode)}] ${req.method} ${req.url} - ${appError.message}`
	);

	// Send error response
	res.status(appError.statusCode).json({
		error: {
			message: appError.message,
			statusCode: appError.statusCode,
			...(env.NODE_ENV === "development" && {
				stack: appError.stack
					?.split("\n")
					.filter((line) => line.includes("/Server/src/"))
					.map((line) => line.trim())
					.slice(0, 3),
			}),
		},
	});
};

const handlePrismaError = (
	error: Error & {
		code?: string;
		meta?: { cause?: string; field_name?: string; target?: string[] };
	}
): AppError => {
	const code = error.code;
	const meta = error.meta;

	switch (code) {
		case "P2002": {
			const field = meta?.target ? ` (${meta.target.join(", ")})` : "";
			return new AppError(`Duplicate entry${field}`, StatusCodes.CONFLICT);
		}
		case "P2003":
			return new AppError(
				`Invalid reference: ${meta?.field_name ?? "foreign key"}`,
				StatusCodes.BAD_REQUEST
			);
		case "P2025":
			return new AppError(
				`Record not found: ${meta?.cause ?? "resource"}`,
				StatusCodes.NOT_FOUND
			);
		default:
			return new AppError(
				`Database error (${code ?? "unknown"}): ${error.message}`,
				StatusCodes.INTERNAL_SERVER_ERROR
			);
	}
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
	const message = `${req.method} ${req.originalUrl} not found`;
	next(new AppError(message, StatusCodes.NOT_FOUND));
};

export const asyncHandler = (
	fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};
