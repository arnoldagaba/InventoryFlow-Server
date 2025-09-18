import argon2 from "argon2";
import crypto from "crypto";

import logger from "./logger.js";

const ARGON2_OPTIONS: argon2.Options = {
	memoryCost: 2 ** 16, // 64 MiB
	parallelism: 1, // 1 thread
	timeCost: 3, // 3 iterations
	type: argon2.argon2id,
};

export function generateSecureToken(length = 32): string {
	return crypto.randomBytes(length).toString("hex");
}

export async function hashPassword(password: string): Promise<string> {
	try {
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
