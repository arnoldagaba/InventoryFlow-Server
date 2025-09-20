import type { NextFunction, Request, Response } from "express";

import { userService, UserService } from "#services/user.service.js";
import { extractTokenFromHeader, verifyAccessToken } from "#utils/jwt.js";
import logger from "#utils/logger.js";
import { StatusCodes } from "http-status-codes";

export class AuthMiddleware {
	constructor(private userService: UserService) {}

	/**
	 * Middleware checks for authentication but doesn't require it
	 */
	optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const authHeader = req.headers.authorization;
			const token = extractTokenFromHeader(authHeader);

			if (!token) {
				next();
				return;
			}

			try {
				const payload = await verifyAccessToken(token);
				const user = await this.userService.findUserById(payload.userId);
				if (user) {
					req.user = user as NonNullable<typeof user>;
				}
			} catch (error) {
				logger.error({ error }, "Failed to verify access token");
			}
			next();
		} catch (error) {
			logger.error({ error }, "Failed to verify access token");
			next();
		}
	};

	/**
	 * Middleware to verify JWT tokens and attach user object to request
	 */
	requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			// Extract token from authorization header
			const authHeader = req.headers.authorization;
			const token = extractTokenFromHeader(authHeader);

			if (!token) {
				res.status(StatusCodes.UNAUTHORIZED).json({
					message: "Missing authorization token",
					success: false,
				});
				return;
			}

			// Verify token
			const payload = await verifyAccessToken(token);

			// Get user from database
			const user = await this.userService.findUserById(payload.userId);
			if (!user) {
				res.status(StatusCodes.UNAUTHORIZED).json({
					message: "User not found",
					success: false,
				});
				return;
			}

			// Attach user object to request
			req.user = user as NonNullable<typeof user>;
			next();
		} catch (error) {
			if (error instanceof Error) {
				res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
					message: error.message,
					success: false,
				});
			} else {
				res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
					message: "An unknown error occurred",
					success: false,
				});
			}
		}
	};

	requirePermission =
		(requiredPermission: string) =>
		(req: Request, res: Response, next: NextFunction): void => {
			const user = req.user;
			if (!user) {
				res.status(StatusCodes.UNAUTHORIZED).json({
					message: "User not found",
					success: false,
				});
				return;
			}

			// Check if user has the required permission
			const hasPermission = user.role.permissions.some(
				(p) => p.permission === requiredPermission
			);

			if (!hasPermission) {
				res.status(StatusCodes.FORBIDDEN).json({
					message: `You don't have permission to ${requiredPermission.toLowerCase().replace("_", " ")}`,
					success: false,
				});
				return;
			}

			next();
		};

	requireRole =
		(allowedRoles: string[]) =>
		(req: Request, res: Response, next: NextFunction): void => {
			const user = req.user;
			if (!user) {
				res.status(StatusCodes.UNAUTHORIZED).json({
					message: "User not found",
					success: false,
				});
				return;
			}

			// Role check
			if (!allowedRoles.includes(user.role.name)) {
				res.status(StatusCodes.FORBIDDEN).json({
					message: "Forbidden",
					success: false,
				});
				return;
			}

			next();
		};
}

export const authmiddleware = new AuthMiddleware(userService);
