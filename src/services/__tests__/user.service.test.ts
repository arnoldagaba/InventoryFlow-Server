/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictError, UnauthorizedError } from "#errors/AppError.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserService } from "../user.service.js";

// Mock Prisma - we'll simulate database responses instead of using real database
// This makes tests fast and predictable
vi.mock("#config/prisma.js", () => ({
	default: {
		user: {
			create: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

// Mock the audit service - we don't want to actually log during tests
vi.mock("../audit.service.js", () => ({
	logLogin: vi.fn(),
	logUserCreation: vi.fn(),
}));

// Mock password utilities - we'll control their behavior for testing
vi.mock("#utils/password.js", () => ({
	hashPassword: vi.fn(),
	needsRehash: vi.fn(),
	verifyPassword: vi.fn(),
}));

// Mock JWT utilities
vi.mock("#utils/jwt.js", () => ({
	generateAccessToken: vi.fn(),
	generateRefreshToken: vi.fn(),
	verifyRefreshToken: vi.fn(),
}));

// Import the mocked modules so we can control their behavior
import prisma from "#config/prisma.js";
import { generateAccessToken, generateRefreshToken } from "#utils/jwt.js";
import { hashPassword, needsRehash, verifyPassword } from "#utils/password.js";

import { logLogin } from "../audit.service.js";

describe("UserService", () => {
	let userService: UserService;

	// Reset all mocks before each test to ensure clean state
	beforeEach(() => {
		userService = new UserService();
		vi.clearAllMocks();
	});

	describe("User Authentication", () => {
		it("should authenticate user with valid credentials", async () => {
			// Arrange: Set up the scenario - valid user exists with correct password
			const loginData = {
				identifier: "admin@inventoryflow.com",
				password: "SecureAdmin123!",
			};

			const mockUser = {
				createdAt: new Date(),
				email: "admin@inventoryflow.com",
				firstName: "Admin",
				id: "user-123",
				isActive: true,
				lastLoginAt: null,
				lastName: "User",
				password: "$argon2id$v=19$m=65536,t=3,p=2$hashed-password",
				role: { id: "role-1", name: "Admin", permissions: [] },
				roleId: "role-1",
				updatedAt: new Date(),
				username: "admin",
			};

			// Set up mock responses - tell the mocks what to return
			vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser);
			vi.mocked(verifyPassword).mockResolvedValue(true);
			vi.mocked(needsRehash).mockReturnValue(false);
			vi.mocked(generateAccessToken).mockResolvedValue("mock-access-token");
			vi.mocked(generateRefreshToken).mockResolvedValue("mock-refresh-token");
			vi.mocked(prisma.user.update).mockResolvedValue(mockUser);

			// Act: Try to authenticate the user
			const result = await userService.authenticateUser(loginData, "127.0.0.1", "test-agent");

			// Assert: Check that authentication succeeded and returned expected data
			expect(result).toEqual({
				accessToken: "mock-access-token",
				refreshToken: "mock-refresh-token",
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				user: expect.objectContaining({
					email: "admin@inventoryflow.com",
					id: "user-123",
					username: "admin",
				}),
			});

			// Verify that the right methods were called with right parameters
			expect(prisma.user.findFirst).toHaveBeenCalledWith({
				include: { role: { include: { permissions: true } } },
				where: {
					isActive: true,
					OR: [
						{ email: "admin@inventoryflow.com" },
						{ username: "admin@inventoryflow.com" },
					],
				},
			});

			expect(verifyPassword).toHaveBeenCalledWith(
				"SecureAdmin123!",
				"$argon2id$v=19$m=65536,t=3,p=2$hashed-password"
			);

			expect(logLogin).toHaveBeenCalledWith("user-123", "127.0.0.1", "test-agent");
		});

		it("should reject authentication for non-existent user", async () => {
			// Arrange: User doesn't exist in database
			const loginData = {
				identifier: "nonexistent@example.com",
				password: "AnyPassword123!",
			};

			vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

			// Act & Assert: Should throw UnauthorizedError
			await expect(
				userService.authenticateUser(loginData, "127.0.0.1", "test-agent")
			).rejects.toThrow(UnauthorizedError);

			await expect(
				userService.authenticateUser(loginData, "127.0.0.1", "test-agent")
			).rejects.toThrow("Invalid credentials provided");

			// Should not attempt password verification for non-existent user
			expect(verifyPassword).not.toHaveBeenCalled();
		});

		it("should reject authentication for inactive user", async () => {
			// Arrange: User exists but account is deactivated
			const mockInactiveUser = {
				createdAt: new Date(), // Add a placeholder value for createdAt
				email: "inactive@example.com",
				firstName: "John", // Add a placeholder value for firstName
				id: "user-456",
				isActive: false, // Key difference - account is disabled
				lastLoginAt: null, // Add a placeholder value for lastLoginAt
				lastName: "Doe", // Add a placeholder value for lastName
				password: "hashed-password",
				roleId: "role-2", // Add a placeholder value for roleId
				updatedAt: new Date(), // Add a placeholder value for updatedAt
				username: "test", // Add a placeholder value for username
			};

			vi.mocked(prisma.user.findFirst).mockResolvedValue(mockInactiveUser);

			// Act & Assert: Should reject inactive user
			await expect(
				userService.authenticateUser(
					{ identifier: "inactive@example.com", password: "AnyPassword123!" },
					"127.0.0.1",
					"test-agent"
				)
			).rejects.toThrow("Your account is deactivated");

			// Should not verify password for inactive user
			expect(verifyPassword).not.toHaveBeenCalled();
		});

		it("should reject authentication for wrong password", async () => {
			// Arrange: User exists but password is wrong
			const mockUser = {
				createdAt: new Date(), // add createdAt
				email: "user@example.com",
				firstName: "First Name",
				id: "user-789",
				isActive: true,
				lastLoginAt: new Date(),
				lastName: "Last Name",
				password: "correct-hashed-password",
				role: { id: "role-1", name: "User", permissions: [] },
				roleId: "role-123",
				updatedAt: new Date(), // add updatedAt
				username: "username",
			};

			vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser);
			vi.mocked(verifyPassword).mockResolvedValue(false); // Password verification fails

			// Act & Assert: Should reject wrong password
			await expect(
				userService.authenticateUser(
					{ identifier: "user@example.com", password: "WrongPassword123!" },
					"127.0.0.1",
					"test-agent"
				)
			).rejects.toThrow("Invalid credentials provided");

			// Should have attempted password verification
			expect(verifyPassword).toHaveBeenCalledWith(
				"WrongPassword123!",
				"correct-hashed-password"
			);
		});
	});

	describe("User Creation", () => {
		it("should create new user with valid data", async () => {
			// Arrange: Valid registration data
			const userData = {
				email: "newuser@example.com",
				firstName: "New",
				lastName: "User",
				password: "SecurePass123!",
				roleId: "role-123",
				username: "newuser",
			};

			const createdUser = {
				id: "new-user-123",
				...userData,
				createdAt: new Date("2025-09-21T14:09:27.680Z"),
				isActive: true,
				lastLoginAt: null,
				password: "hashed-password",
				updatedAt: new Date("2025-09-21T14:09:27.680Z"),
			};

			// Mock successful creation flow
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // Email doesn't exist
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // Username doesn't exist
			vi.mocked(hashPassword).mockResolvedValue("hashed-password");
			vi.mocked(prisma.user.create).mockResolvedValue(createdUser);

			// Act: Create the user
			const result = await userService.createUser(
				userData,
				"admin-user-id",
				"127.0.0.1",
				"test-agent"
			);

			// Assert: Should return user without password
			expect(result).toEqual({
				createdAt: new Date("2025-09-21T14:09:27.680Z"),
				email: "newuser@example.com",
				firstName: "New",
				id: "new-user-123",
				isActive: true,
				lastLoginAt: null,
				lastName: "User",
				roleId: "role-123",
				updatedAt: new Date("2025-09-21T14:09:27.680Z"),
				username: "newuser",
			});

			// Should have hashed the password
			expect(hashPassword).toHaveBeenCalledWith("SecurePass123!");

			// Should have created user in database
			expect(prisma.user.create).toHaveBeenCalledWith({
				data: {
					...userData,
					password: "hashed-password",
				},
			});
		});

		it("should reject user creation with duplicate email", async () => {
			// Arrange: Email already exists
			const userData = {
				email: "existing@example.com",
				firstName: "New",
				lastName: "User",
				password: "SecurePass123!",
				roleId: "role-123",
				username: "newuser",
			};

			const existingUser = {
				createdAt: new Date(),
				email: "existing@example.com",
				firstName: "Existing",
				id: "existing-123",
				isActive: true,
				lastLoginAt: null,
				lastName: "User",
				password: "existing-password",
				roleId: "role-123",
				updatedAt: new Date(),
				username: "existing-username",
			};

			vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser);

			// Act & Assert: Should throw ConflictError
			await expect(
				userService.createUser(userData, "admin-id", "127.0.0.1", "test-agent")
			).rejects.toThrow(ConflictError);

			await expect(
				userService.createUser(userData, "admin-id", "127.0.0.1", "test-agent")
			).rejects.toThrow("Email address is already registered");

			// Should not have attempted to hash password or create user
			expect(hashPassword).not.toHaveBeenCalled();
			expect(prisma.user.create).not.toHaveBeenCalled();
		});
	});

	describe("User Lookup", () => {
		it("should find active user by ID", async () => {
			// Arrange: Active user exists
			const mockUser = {
				createdAt: new Date(),
				email: "user@example.com",
				firstName: "John",
				id: "user-123",
				isActive: true,
				lastLoginAt: null,
				lastName: "Doe",
				password: "password123",
				role: {
					id: "role-1",
					name: "User",
					permissions: [{ permission: "USERS_VIEW" }],
				},
				roleId: "role-1",
				updatedAt: new Date(),
				username: "user123",
			};

			vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser);

			// Act: Look up user
			const result = await userService.findUserById("user-123");

			// Assert: Should return the user
			expect(result).toEqual(mockUser);

			expect(prisma.user.findFirst).toHaveBeenCalledWith({
				include: { role: { include: { permissions: true } } },
				where: { id: "user-123", isActive: true },
			});
		});

		it("should return null for inactive user", async () => {
			// Arrange: No active user found
			vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

			// Act: Try to find inactive user
			const result = await userService.findUserById("inactive-user-123");

			// Assert: Should return null
			expect(result).toBeNull();
		});
	});
});
