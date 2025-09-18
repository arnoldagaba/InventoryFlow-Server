import { env } from "#config/env.js";
import { User } from "#generated/prisma/client.js";

export const securityConfig = {
	cors: {
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
		origin: env.ALLOWED_ORIGINS.split(","),
	},
	helmet: {
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				fontSrc: ["'self'", "https://fonts.gstatic.com"],
				imgSrc: ["'self'", "data:", "https:"],
				scriptSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
			},
		},
	},
};

export interface JWTPayload {
	[propName: string]: unknown;
	email?: string;
	roleId?: string;
	type: "access" | "refresh";
	userId: string;
}

export interface LoginRequest {
	identifier: string;
	password: string;
}

export interface LoginResponse {
	accessToken: string;
	refreshToken: string;
	user: UserWithoutPassword;
}

export type UserWithoutPassword = Omit<User, "password">;
