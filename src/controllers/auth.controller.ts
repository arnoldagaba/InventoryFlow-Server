import type { Request, RequestHandler, Response } from "express";

import { env } from "#config/env.js";
import { asyncHandler } from "#middleware/error.middleware.js";
import { logLogout } from "#services/audit.service.js";
import { userService, UserService } from "#services/user.service.js";
import { loginSchema, RefreshTokenDTO } from "#validators/auth.validators.js";
import { StatusCodes } from "http-status-codes";

class AuthController {
	/**
	 * POST /auth/login
	 * Authenticate user with email/username and password.
	 * This method handles the core authentication logic - finding the user and verifying credentials
	 */
	login: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
		const data = loginSchema.parse(req.body);
		const { accessToken, refreshToken, user } = await userService.authenticateUser(
			data,
			req.ip,
			req.headers["user-agent"]
		);

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			sameSite: "strict",
			secure: env.NODE_ENV === "production",
		});

		res.status(StatusCodes.OK).json({
			accessToken,
			message: "Login successful",
			success: true,
			user,
		});
	});

	/**
	 * POST /auth/logout
	 * Logout authenticated user.
	 */
	logout: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
		const user = req.user;
		
		if (user) {
			await logLogout(user.id, req.ip, req.headers["user-agent"]);
		}

		res.clearCookie("refreshToken", {
			httpOnly: true,
			sameSite: "strict",
			secure: env.NODE_ENV === "production",
		});

		res.status(StatusCodes.OK).json({
			message: "Logout successful",
			success: true,
		});
	});

	/**
	 * POST /auth/refresh
	 * Refresh authentication tokens.
	 * Allows clients to get new access tokens without re-entering credentials.
	 */
	refreshToken: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
		const refreshToken = req.cookies.refreshToken as RefreshTokenDTO["refreshToken"];
		if (!refreshToken) {
			res.status(StatusCodes.UNAUTHORIZED).json({
				message: "No refresh token provided",
				success: false,
			});
			return;
		}

		const {
			accessToken,
			refreshToken: newRefreshToken,
			user,
		} = await userService.refreshTokens(refreshToken);

		res.cookie("refreshToken", newRefreshToken, {
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			sameSite: "strict",
			secure: env.NODE_ENV === "production",
		});

		res.status(StatusCodes.OK).json({
			accessToken,
			message: "Token refreshed successfully",
			success: true,
			user,
		});
	});

	constructor(private userService: UserService) {}
}

export const authController = new AuthController(userService);
