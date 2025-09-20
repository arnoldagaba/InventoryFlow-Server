import prisma from "#config/prisma.js";
import { AppError, ConflictError, UnauthorizedError } from "#errors/AppError.js";
import { LoginResponse, UserWithoutPassword } from "#types/auth.types.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "#utils/jwt.js";
import logger from "#utils/logger.js";
import { hashPassword, needsRehash, verifyPassword } from "#utils/password.js";
import { LoginDTO } from "#validators/auth.validators.js";
import { RegisterDTO } from "#validators/user.validators.js";

import { logLogin, logUserCreation } from "./audit.service.js";

export class UserService {
	/**
	 * Authenticate user with email/username and password.
	 * This method handles the core authentication logic - finding the user and verifying credentials
	 *
	 * @param data - Login data containing identifier and password
	 * @param ipAddress - Client IP address for audit logging
	 * @param userAgent - Client user agent for audit logging
	 *
	 * @returns Promise<LoginResponse> - Returns a promise that resolves to the authentication response with tokens
	 * @throws Error if authentication fails for any reason
	 */
	async authenticateUser(
		data: LoginDTO,
		ipAddress?: string,
		userAgent?: string
	): Promise<LoginResponse> {
		// Find the user
		const user = await this.findUserByIdentifier(data.identifier);
		if (!user) {
			// NOTE: Don't reveal whether user with this identifier exists
			throw new UnauthorizedError("Invalid credentials provided");
		}

		// Check if user account is active
		if (!user.isActive) {
			throw new UnauthorizedError("Your account is deactivated");
		}

		// Verify password provided against stored hash
		const isPasswordValid = await verifyPassword(data.password, user.password);
		if (!isPasswordValid) {
			// NOTE: Same generic message as above
			throw new UnauthorizedError("Invalid credentials provided");
		}

		// Check if password hash needs updating
		if (needsRehash(user.password)) {
			try {
				// Rehash password with current security parameters
				const newHashedPassword = await hashPassword(data.password);
				await prisma.user.update({
					data: { password: newHashedPassword },
					where: { id: user.id },
				});

				logger.info(
					{ userId: user.id },
					"User password updated due to security parameters"
				);
			} catch (error) {
				// NOTE: Uer can still log in, we'll try rehashing next time.
				logger.error(
					{ error },
					"Failed to update user password due to security parameters"
				);
			}
		}

		// Update last login and generate auth tokens
		const [accessToken, refreshToken] = await Promise.all([
			generateAccessToken(user.id, user.email, user.role.name),
			generateRefreshToken(user.id),
			prisma.user.update({
				data: { lastLoginAt: new Date() },
				where: { id: user.id },
			}),
			logLogin(user.id, ipAddress, userAgent),
		]);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password, ...userWithoutPassword } = user;

		return {
			accessToken,
			refreshToken,
			user: userWithoutPassword,
		};
	}

	/**
	 * Create a new user account.
	 * Handles the complete user registration process.
	 *
	 * @param userData - Validated user registration data
	 * @param createdByUserId - ID of the user creating this account (for audit)
	 * @returns Promise<UserWithoutPassword> - Returns a promise that resolves to the created user object
	 * @throws Error if user creation fails for any reason
	 */
	async createUser(
		userData: RegisterDTO,
		createdByUserId?: string,
		ipAddress?: string,
		userAgent?: string
	): Promise<UserWithoutPassword> {
		// Check if email already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: userData.email },
		});
		if (existingUser) {
			throw new ConflictError("Email address is already registered");
		}

		// Check if username is already taken
		const existingUsername = await prisma.user.findUnique({
			where: { username: userData.username },
		});
		if (existingUsername) {
			throw new ConflictError("Username is already taken");
		}

		// Hash the password
		const hashedPassword = await hashPassword(userData.password);

		try {
			// Create the user
			const user = await prisma.user.create({
				data: { ...userData, password: hashedPassword },
			});

			// Log user creation audit
			if (createdByUserId) {
				await logUserCreation(
					user.id,
					user.email,
					user.username,
					createdByUserId,
					user.firstName,
					user.lastName,
					ipAddress,
					userAgent
				);
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password, ...userWithoutPassword } = user;

			return userWithoutPassword;
		} catch (error) {
			logger.error({ error }, "Failed to create the user");
			throw new AppError("Failed to create user account");
		}
	}

	/**
	 * Find user by ID.
	 *
	 * @param userId - Unique user identifier
	 * @returns Promise<User|null> - User object or null if not found
	 */
	async findUserById(userId: string) {
		try {
			const user = await prisma.user.findFirst({
				include: { role: { include: { permissions: true } } },
				where: { id: userId, isActive: true },
			});
			return user;
		} catch (error) {
			logger.error({ error }, "Find user by ID failed");
			return null;
		}
	}

	/**
	 * Get all users with their roles
	 */
	async getAllUsers() {
		const users = await prisma.user.findMany({
			include: { role: true },
			orderBy: { createdAt: "desc" },
		});
		
		// Remove password field from each user
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		return users.map(({ password, ...user }) => user);
	}

	/**
	 * Retrieve user details
	 */
	async getCurrentUser(userId: string) {
		try {
			const user = await this.findUserById(userId);
			if (!user) {
				throw new UnauthorizedError("User not found or account deactivated");
			}
			
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password, ...userWithoutPassword } = user;
			return userWithoutPassword;
		} catch (error) {
			logger.error({ error }, "Find current user failed");
			return null;
		}
	}

	/**
	 * Refresh authentication tokens.
	 * Allows clients to get new access tokens without re-entering credentials.
	 *
	 * @param refreshToken - The refresh token provided by the client
	 * @returns Promise<LoginResponse> - Returns a promise that resolves to the new authentication response with new tokens
	 * @throws Error if token refresh fails for any reason
	 */
	async refreshTokens(refreshToken: string): Promise<LoginResponse> {
		const { userId } = await verifyRefreshToken(refreshToken);

		// Ensure user still exists and is active
		const user = await this.findUserById(userId);
		if (!user?.isActive) {
			throw new UnauthorizedError("User not found or account deactivated");
		}

		const [accessToken, newRefreshToken] = await Promise.all([
			generateAccessToken(user.id, user.email, user.roleId),
			generateRefreshToken(user.id),
		]);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password, ...userWithoutPassword } = user;
		return {
			accessToken,
			refreshToken: newRefreshToken,
			user: userWithoutPassword,
		};
	}

	/**
	 * Find user by email or username.
	 * Private helper method that centralizes user lookup logic.
	 * This method handles the complexity of searching across two different fields.
	 *
	 * @param identifier - Can be either email or username
	 * @returns Promise<User | null> - Returns a promise that resolves to the user object if found
	 */
	private async findUserByIdentifier(identifier: string) {
		try {
			const user = await prisma.user.findFirst({
				include: { role: { include: { permissions: true } } },
				where: {
					isActive: true,
					OR: [{ email: identifier }, { username: identifier }],
				},
			});
			return user;
		} catch (error) {
			logger.error({ error }, "Find user by identifier failed");
			return null;
		}
	}
}

export const userService = new UserService();
