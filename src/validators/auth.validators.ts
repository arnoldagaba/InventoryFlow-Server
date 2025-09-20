import { z } from "zod";

export const emailSchema = z.string().email("Please provide a valid email address").toLowerCase().trim();
export const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters long")
	.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
	.regex(/[a-z]/, "Password must contain at least one lowercase letter")
	.regex(/\d/, "Password must contain at least one number")
	.regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Validation schemas using Zod for type-safe input validation
export const loginSchema = z.object({
	identifier: z
		.string({ required_error: "Email or username is required" })
		.min(1, "Email or username cannot be empty")
		.max(254, "Identifier is too long")
		.toLowerCase(),
	password: z
		.string({ required_error: "Password is required" })
		.min(8, "Password must be at least 8 characters long")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/\d/, "Password must contain at least one number")
		.regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
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
