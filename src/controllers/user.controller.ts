import { asyncHandler } from "#middleware/error.middleware.js";
import { userService, UserService } from "#services/user.service.js";
import { registerSchema } from "#validators/user.validators.js";
import { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

class UserController {
	/**
	 * GET /users/
	 * Get all users. Requires USERS_VIEW permission.
	 */
	getAllUsers: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
		const users = await userService.getAllUsers();
		res.status(StatusCodes.OK).json(users);
	});

	/**
	 * GET /users/me
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

	/**
	 * GET /users/:id
	 * Get user by ID. Requires USERS_VIEW permission.
	 */
	getSpecificUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
		const userId = req.params.id;

		const user = await userService.findUserById(userId);
		if (!user) {
			res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
			return;
		}

		// Leave out the password
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password, ...userWithoutPassword } = user;

		res.status(StatusCodes.OK).json(userWithoutPassword);
	});

	/**
	 * POST /users/register
	 * Register a new user. Only by admins.
	 */
	registerUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
		if (!req.user) {
			res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not authenticated" });
			return;
		}

		const data = registerSchema.parse(req.body);
		const user = await userService.createUser(
			data,
			req.user.id,
			req.ip,
			req.headers["user-agent"]
		);

		res.status(StatusCodes.CREATED).json({
			message: "User registered successfully",
			success: true,
			user,
		});
	});

	constructor(private userService: UserService) {}
}

export const userController = new UserController(userService);
