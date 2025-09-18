import { z } from "zod";

const emailSchema = z.email("Please provide a valid email address").toLowerCase().trim();
const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters long")
	.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
	.regex(/[a-z]/, "Password must contain at least one lowercase letter")
	.regex(/\d/, "Password must contain at least one number")
	.regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Validation schemas using Zod for type-safe input validation
export const registerSchema = z.object({
	email: emailSchema,
	firstName: z
		.string()
		.min(1, "First name is required")
		.max(50, "First name must be less than 50 characters")
		.trim(),
	lastName: z
		.string()
		.min(1, "Last name is required")
		.max(50, "Last name must be less than 50 characters")
		.trim(),
	password: passwordSchema,
	roleId: z.string(),
	username: z
		.string()
		.min(1, "Username is required")
		.max(50, "Username must be less than 50 characters")
		.trim(),
});
export type RegisterDTO = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
	identifier: z
		.string()
		.min(1, "Email or username is required")
		.max(254, "Identifier too")
		.toLowerCase(),
	password: passwordSchema,
});
export type LoginDTO = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, "Refresh token is required"),
});
export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;

export const changePasswordSchema = z.object({
	newPassword: z
		.string()
		.min(8, "New password must be at least 8 characters long")
		.regex(/[A-Z]/, "New password must contain at least one uppercase letter")
		.regex(/[a-z]/, "New password must contain at least one lowercase letter")
		.regex(/\d/, "New password must contain at least one number")
		.regex(/[^A-Za-z0-9]/, "New password must contain at least one special character"),
	oldPassword: z.string().min(1, "Current password is required"),
});
