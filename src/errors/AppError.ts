import { StatusCodes } from "http-status-codes";

export class AppError extends Error {
	public readonly isOperational: boolean;
	public readonly statusCode: number;

	constructor(message: string, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}
}

export class ConflictError extends AppError {
	constructor(message = "Resource already exists") {
		super(message, StatusCodes.CONFLICT);
	}
}

export class DatabaseError extends AppError {
	constructor(message = "Database operation failed") {
		super(message, StatusCodes.INTERNAL_SERVER_ERROR);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super(message, StatusCodes.FORBIDDEN);
	}
}

export class NotFoundError extends AppError {
	constructor(resource = "Resource") {
		super(`${resource} not found`, StatusCodes.NOT_FOUND);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super(message, StatusCodes.UNAUTHORIZED);
	}
}

export class ValidationError extends AppError {
	constructor(message = "Validation failed") {
		super(message, StatusCodes.BAD_REQUEST);
	}
}