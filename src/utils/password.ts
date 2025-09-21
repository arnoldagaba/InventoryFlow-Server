import { env } from "#config/env.js";
import argon2 from "argon2";
import crypto from "crypto";

import logger from "./logger.js";

const ARGON2_OPTIONS: argon2.Options = {
	hashLength: 32, // 32 byte hash length
	memoryCost: env.NODE_ENV === "development" ? 32768 : 65536, // 32 MB for development (increase to 65536 for production)
	parallelism: 2, // 2 parallel threads
	timeCost: env.NODE_ENV === "development" ? 2 : 3, // 2 iterations for development (increase to 3 for production)
	type: argon2.argon2id,
};

export function generateSecureToken(length = 32): string {
	return crypto.randomBytes(length).toString("hex");
}

export async function hashPassword(password: string): Promise<string> {
	try {
		// Basic validation: argon2.hash will accept empty strings in some libs,
		// but application logic expects empty/invalid passwords to be rejected.
		if (typeof password !== "string" || password.length === 0) {
			throw new Error("Invalid password");
		}
		const hashedPassword = await argon2.hash(password, ARGON2_OPTIONS);
		return hashedPassword;
	} catch (error) {
		logger.error({ error }, "Failed to hash password");
		throw new Error("Failed to hash password");
	}
}

export function needsRehash(hashedPassword: string): boolean {
	try {
		return argon2.needsRehash(hashedPassword, ARGON2_OPTIONS);
	} catch (error) {
		logger.error({ error }, "Failed to check if password needs rehash");
		return true;
	}
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	try {
		return await argon2.verify(hashedPassword, password, ARGON2_OPTIONS);
	} catch (error) {
		logger.error({ error }, "Failed to verify password");
		return false;
	}
}
