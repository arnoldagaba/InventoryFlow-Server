import { asyncHandler } from "#middleware/error.middleware.js";
import { userService, UserService } from "#services/user.service.js";
import { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

class UserController {
	/**
	 * GET /auth/me
	 * Get current user profile information.
	 */
	getCurrentUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
		if (!req.user) {
			res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not authenticated" });
			return;
		}
        
		const user = await userService.getCurrentUser(req.user.id);
		res.status(StatusCodes.OK).json(user);
	});

	constructor(private userService: UserService) {}
}

export const userController = new UserController(userService);
