import type { User } from "#generated/prisma/client.js";

import { ConflictError, UnauthorizedError } from "#errors/AppError.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserService } from "../user.service.js";

// Create proper mock types - this helps TypeScript understand what we're mocking
const mockPrisma = {
	user: {
		create: vi.fn(),
		findFirst: vi.fn(),
		findMany: vi.fn(),
		findUnique: vi.fn(),
		update: vi.fn(),
	},
};

// Mock modules with proper typing
vi.mock("#config/prisma.js", () => ({
	default: mockPrisma,
}));

// Mock the audit service functions
const mockLogLogin = vi.fn();
const mockLogUserCreation = vi.fn();

vi.mock("../audit.service.js", () => ({
	logLogin: mockLogLogin,
	logUserCreation: mockLogUserCreation,
}));

// Mock password utilities with proper typing
const mockHashPassword = vi.fn();
const mockVerifyPassword = vi.fn();
const mockNeedsRehash = vi.fn();

vi.mock("#utils/password.js", () => ({
	hashPassword: mockHashPassword,
	needsRehash: mockNeedsRehash,
	verifyPassword: mockVerifyPassword,
}));

// Mock JWT utilities with proper typing
const mockGenerateAccessToken = vi.fn();
const mockGenerateRefreshToken = vi.fn();
const mockVerifyRefreshToken = vi.fn();

vi.mock("#utils/jwt.js", () => ({
	generateAccessToken: mockGenerateAccessToken,
	generateRefreshToken: mockGenerateRefreshToken,
	verifyRefreshToken: mockVerifyRefreshToken,
}));

describe("UserService", () => {
	let userService: UserService;

	// Helper test types: Prisma's generated `User` type doesn't include relation fields
	// like `role` with nested `permissions`. Create a test-friendly intersection.
	type UserWithRole = User & {
		role?: null | {
			id: string;
			name: string;
			permissions?: { permission: string }[];
		};
	};

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
				updatedAt: new Date(),
				username: "admin",
			};

			// Set up mock responses using the properly typed mocks
			mockPrisma.user.findFirst.mockResolvedValue(mockUser as unknown as UserWithRole);
			mockVerifyPassword.mockResolvedValue(true);
			mockNeedsRehash.mockReturnValue(false);
			mockGenerateAccessToken.mockResolvedValue("mock-access-token");
			mockGenerateRefreshToken.mockResolvedValue("mock-refresh-token");
			mockPrisma.user.update.mockResolvedValue(mockUser as unknown as UserWithRole);

			// Act: Try to authenticate the user
			const result = await userService.authenticateUser(loginData, "127.0.0.1", "test-agent");

			// Assert: Check that authentication succeeded and returned expected data
			expect(result).toEqual({
				accessToken: "mock-access-token",
				refreshToken: "mock-refresh-token",
				user: expect.objectContaining({
					email: "admin@inventoryflow.com",
					id: "user-123",
					username: "admin",
				}),
			});

			// Verify that the right methods were called with right parameters
			expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
				include: { role: { include: { permissions: true } } },
				where: {
					isActive: true,
					OR: [
						{ email: "admin@inventoryflow.com" },
						{ username: "admin@inventoryflow.com" },
					],
				},
			});

			expect(mockVerifyPassword).toHaveBeenCalledWith(
				"SecureAdmin123!",
				"$argon2id$v=19$m=65536,t=3,p=2$hashed-password"
			);

			expect(mockLogLogin).toHaveBeenCalledWith("user-123", "127.0.0.1", "test-agent");
		});

		it("should reject authentication for non-existent user", async () => {
			// Arrange: User doesn't exist in database
			const loginData = {
				identifier: "nonexistent@example.com",
				password: "AnyPassword123!",
			};

			mockPrisma.user.findFirst.mockResolvedValue(null);

			// Act & Assert: Should throw UnauthorizedError
			await expect(
				userService.authenticateUser(loginData, "127.0.0.1", "test-agent")
			).rejects.toThrow(UnauthorizedError);

			await expect(
				userService.authenticateUser(loginData, "127.0.0.1", "test-agent")
			).rejects.toThrow("Invalid credentials provided");

			// Should not attempt password verification for non-existent user
			expect(mockVerifyPassword).not.toHaveBeenCalled();
		});

		it("should reject authentication for inactive user", async () => {
			// Arrange: User exists but account is deactivated
			const mockInactiveUser = {
				email: "inactive@example.com",
				id: "user-456",
				isActive: false, // Key difference - account is disabled
				password: "hashed-password",
			};

			mockPrisma.user.findFirst.mockResolvedValue(
				mockInactiveUser as unknown as Partial<User>
			);

			// Act & Assert: Should reject inactive user
			await expect(
				userService.authenticateUser(
					{ identifier: "inactive@example.com", password: "AnyPassword123!" },
					"127.0.0.1",
					"test-agent"
				)
			).rejects.toThrow("Your account is deactivated");

			// Should not verify password for inactive user
			expect(mockVerifyPassword).not.toHaveBeenCalled();
		});

		it("should reject authentication for wrong password", async () => {
			// Arrange: User exists but password is wrong
			const mockUser = {
				email: "user@example.com",
				id: "user-789",
				isActive: true,
				password: "correct-hashed-password",
				role: { id: "role-1", name: "User", permissions: [] },
			};

			mockPrisma.user.findFirst.mockResolvedValue(mockUser as unknown as UserWithRole);
			mockVerifyPassword.mockResolvedValue(false); // Password verification fails

			// Act & Assert: Should reject wrong password
			await expect(
				userService.authenticateUser(
					{ identifier: "user@example.com", password: "WrongPassword123!" },
					"127.0.0.1",
					"test-agent"
				)
			).rejects.toThrow("Invalid credentials provided");

			// Should have attempted password verification
			expect(mockVerifyPassword).toHaveBeenCalledWith(
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
				createdAt: new Date(),
				isActive: true,
				lastLoginAt: null,
				password: "hashed-password",
				updatedAt: new Date(),
			};

			// Mock successful creation flow
			mockPrisma.user.findUnique.mockResolvedValue(null); // Email doesn't exist
			mockPrisma.user.findUnique.mockResolvedValue(null); // Username doesn't exist
			mockHashPassword.mockResolvedValue("hashed-password");
			mockPrisma.user.create.mockResolvedValue(createdUser as unknown as User);

			// Act: Create the user
			const result = await userService.createUser(
				userData,
				"admin-user-id",
				"127.0.0.1",
				"test-agent"
			);

			// Assert: Should return user without password
			expect(result).toEqual({
				createdAt: expect.any(Date),
				email: "newuser@example.com",
				firstName: "New",
				id: "new-user-123",
				isActive: true,
				lastLoginAt: null,
				lastName: "User",
				roleId: "role-123",
				updatedAt: expect.any(Date),
				username: "newuser",
			});

			// Should have hashed the password
			expect(mockHashPassword).toHaveBeenCalledWith("SecurePass123!");

			// Should have created user in database
			expect(mockPrisma.user.create).toHaveBeenCalledWith({
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
				email: "existing@example.com",
				id: "existing-123",
			};

			mockPrisma.user.findUnique.mockResolvedValue(existingUser as unknown as Partial<User>);

			// Act & Assert: Should throw ConflictError
			await expect(
				userService.createUser(userData, "admin-id", "127.0.0.1", "test-agent")
			).rejects.toThrow(ConflictError);

			await expect(
				userService.createUser(userData, "admin-id", "127.0.0.1", "test-agent")
			).rejects.toThrow("Email address is already registered");

			// Should not have attempted to hash password or create user
			expect(mockHashPassword).not.toHaveBeenCalled();
			expect(mockPrisma.user.create).not.toHaveBeenCalled();
		});
	});

	describe("User Lookup", () => {
		it("should find active user by ID", async () => {
			// Arrange: Active user exists
			const mockUser = {
				email: "user@example.com",
				id: "user-123",
				isActive: true,
				role: {
					id: "role-1",
					name: "User",
					permissions: [{ permission: "USERS_VIEW" }],
				},
			};

			mockPrisma.user.findFirst.mockResolvedValue(mockUser as unknown as UserWithRole);

			// Act: Look up user
			const result = await userService.findUserById("user-123");

			// Assert: Should return the user
			expect(result).toEqual(mockUser);

			expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
				include: { role: { include: { permissions: true } } },
				where: { id: "user-123", isActive: true },
			});
		});

		it("should return null for inactive user", async () => {
			// Arrange: No active user found
			mockPrisma.user.findFirst.mockResolvedValue(null);

			// Act: Try to find inactive user
			const result = await userService.findUserById("inactive-user-123");

			// Assert: Should return null
			expect(result).toBeNull();
		});
	});
});
