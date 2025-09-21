import { env } from "#config/env.js";
import { AppError, UnauthorizedError } from "#errors/AppError.js";
import { JWTPayload } from "#types/auth.types.js";
import { createSecretKey } from "crypto";
import crypto from "crypto";
import { jwtVerify, SignJWT } from "jose";

import logger from "./logger.js";

const ACCESS_TOKEN_EXPIRATION = env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRATION = env.REFRESH_TOKEN_EXPIRY;

/**
 * Extract token from Authorization header.
 *
 * @param authHeader - The Authorization header value
 * @returns string | null - The token value or null if not found
 */
export function extractTokenFromHeader(authHeader: string | undefined): null | string {
	if (!authHeader) return null;

	// Cheack for "Bearer " prefix
	const prefix = "Bearer ";
	if (!authHeader.startsWith(prefix)) return null;

	// Extract the token
	const token = authHeader.substring(prefix.length).trim();

	return token.length > 0 ? token : null;
}

/**
 * Generate an access token for authenticated user
 * @param userId - Unique user identifier
 * @param email - User email
 *
 * @returns Access token as a string
 */
export function generateAccessToken(userId: string, email: string, role: string) {
	try {
		const now = Math.floor(Date.now() / 1000);

		// Include a short unique identifier (jti) so tokens generated in the
		// same second are still unique. Use crypto.randomUUID() when available.
		const jti = crypto.randomUUID();

		// Create JWT with minimal payload
		const jwt = new SignJWT({ email, jti, role, type: "access", userId } as JWTPayload)
			.setProtectedHeader({
				alg: "HS256",
			})
			.setIssuedAt(now)
			.setExpirationTime(now + parseExpiry(ACCESS_TOKEN_EXPIRATION))
			.setIssuer("InventoryFlow")
			.setAudience("InventoryFlow-users")
			.sign(getAccessTokenKey());

		return jwt;
	} catch (error) {
		logger.error({ error }, "Failed to generate access token");
		throw new Error("Failed to generate access token");
	}
}

/**
 * Generate refresh token for token renewal
 * @param userId - Unique user identifier
 *
 * @returns Refresh token as a string
 */
export function generateRefreshToken(userId: string) {
	try {
		const now = Math.floor(Date.now() / 1000);

		// Create JWT with minimal payload
		const jti = crypto.randomUUID();
		const jwt = new SignJWT({ jti, type: "refresh", userId } as JWTPayload)
			.setProtectedHeader({
				alg: "HS256",
			})
			.setIssuedAt(now)
			.setExpirationTime(now + parseExpiry(REFRESH_TOKEN_EXPIRATION))
			.setIssuer("InventoryFlow")
			.setAudience("InventoryFlow-users")
			.sign(getRefreshTokenKey());

		return jwt;
	} catch (error) {
		logger.error({ error }, "Failed to generate refresh token");
		throw new Error("Failed to generate refresh token");
	}
}

/**
 * Verify and decode access token.
 * Returns the payload if valid, throws an error if invalid/expired.
 *
 * @param token - The JWT token to verify
 * @returns The decoded payload
 */
export async function verifyAccessToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, getAccessTokenKey(), {
			audience: "InventoryFlow-users",
			issuer: "InventoryFlow",
		});

		if (!payload.userId || !payload.email || payload.type !== "access") {
			throw new UnauthorizedError("Invalid access token");
		}

		return {
			email: payload.email as string,
			exp: payload.exp,
			iat: payload.iat,
			role: payload.role as string,
			userId: payload.userId as string,
		};
	} catch (error) {
		if (error instanceof Error) {
			logger.error({ error }, "Failed to verify access token");
			if (error.message.includes("expired")) {
				throw new UnauthorizedError("Access token has expired");
			}
			if (error.message.includes("signature")) {
				logger.error({ error }, "Invalid token signature");
				throw new UnauthorizedError("Invalid access token");
			}
		}
		throw new UnauthorizedError("Invalid access token");
	}
}

/**
 * Verify and decode refresh token.
 * Returns the payload if valid, throws an error if invalid/expired.
 *
 * @param token - The JWT token to verify
 * @returns The decoded payload
 */
export async function verifyRefreshToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, getRefreshTokenKey(), {
			audience: "InventoryFlow-users",
			issuer: "InventoryFlow",
		});

		if (!payload.userId || payload.type !== "refresh") {
			throw new UnauthorizedError("Invalid refresh token");
		}

		return {
			exp: payload.exp,
			iat: payload.iat,
			userId: payload.userId as string,
		};
	} catch (error) {
		if (error instanceof Error) {
			logger.error({ error }, "Failed to verify refresh token");
			if (error.message.includes("expired")) {
				throw new UnauthorizedError("Refresh token has expired");
			}
			if (error.message.includes("signature")) {
				logger.error({ error }, "Invalid token signature");
				throw new UnauthorizedError("Invalid refresh token");
			}
		}
		throw new UnauthorizedError("Invalid refresh token");
	}
}

// Create keys at call-time so tests can mutate process.env during execution.
function getAccessTokenKey() {
	const secret = process.env.JWT_ACCESS_SECRET ?? env.JWT_ACCESS_SECRET;
	return createSecretKey(Buffer.from(secret, "utf-8"));
}

function getRefreshTokenKey() {
	const secret = process.env.JWT_REFRESH_SECRET ?? env.JWT_REFRESH_SECRET;
	return createSecretKey(Buffer.from(secret, "utf-8"));
}

/**
 * Utility function to convert time strings to seconds.
 * Supports days, hours, minutes, and seconds.
 *
 * @param expiry - Time string in days, hours, minutes, or seconds format.
 *
 * @returns Number of seconds as a number
 */
function parseExpiry(expiry: string): number {
	const unit = expiry.slice(-1);
	const value = parseInt(expiry.slice(0, -1));

	switch (unit) {
		case "d":
			return value * 60 * 60 * 24;
		case "h":
			return value * 60 * 60;
		case "m":
			return value * 60;
		case "s":
			return value;
		default:
			throw new AppError(`Unsupported expiry format: ${expiry}`);
	}
}
