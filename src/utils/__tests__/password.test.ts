import { describe, expect, it } from "vitest";

import { generateSecureToken, hashPassword, needsRehash, verifyPassword } from "../password.js";

describe("Password Utility Functions", () => {
	it("should hash a password successfully", async () => {
		// Arrange: Set up test data
		const plainPassword = "TestPassword123!";

		// Act: Do the thing we're testing
		const hashedPassword = await hashPassword(plainPassword);

		// Assert: Check if the result is what we expected
		expect(hashedPassword).toBeTruthy(); // Should produce some result
		expect(hashedPassword).not.toBe(plainPassword); // Should be different from original
		expect(hashedPassword.length).toBeGreaterThan(50); // Argon2 hashes are long
		expect(hashedPassword).toMatch(/^\$argon2id\$/); // Should start with Argon2 format
	});

	it("should verify correct password against hash", async () => {
		// Arrange: Create a known password and its hash
		const plainPassword = "CorrectPassword123!";
		const hashedPassword = await hashPassword(plainPassword);

		// Act: Try to verify the correct password
		const isValid = await verifyPassword(plainPassword, hashedPassword);

		// Assert: Should return true for correct password
		expect(isValid).toBe(true);
	});

	it("should reject incorrect password against hash", async () => {
		// Arrange Create a password hash
		const correctPassword = "CorrectPassword123!";
		const wrongPassword = "WrongPassword123!";
		const hashedPassword = await hashPassword(correctPassword);

		// Act: Try to verify the wrong password
		const isValid = await verifyPassword(wrongPassword, hashedPassword);

		// Assert: Should return false for wrong password
		expect(isValid).toBe(false);
	});

	it("should generate secure tokens of corect length", () => {
		// Act: Generate tokens of different lengths
		const defaultToken = generateSecureToken(); // Default 32 bytes
		const shortToken = generateSecureToken(16); // 16 bytes
		const longToken = generateSecureToken(64); // 64 bytes

		// Assert: Check lengths and format
		expect(defaultToken).toHaveLength(64); // 32 bytes = 64 hex characters
		expect(shortToken).toHaveLength(32); // 16 bytes = 32 hex characters
		expect(longToken).toHaveLength(128); // 64 bytes = 128 hex characters

		// Should ony contain hex characters (0-9, a-f)
		expect(defaultToken).toMatch(/^[a-f0-9]+$/);
		expect(shortToken).toMatch(/^[a-f0-9]+$/);
		expect(longToken).toMatch(/^[a-f0-9]+$/);
	});

	it("should detect when password needs rehashing", async () => {
		// Arrange: Create a hash with current settings
		const password = "TestPassword123!";
		const currentHash = await hashPassword(password);

		// Act: Check if it needs rehashing
		const needsUpdate = needsRehash(currentHash);

		// Assert: Current password should not need updating
		expect(needsUpdate).toBe(false);
	});

	it("should generate different hashes for same password", async () => {
		// Arrange: Same password
		const password = "SamePassword123!";

		// Act: Hash twice
		const hash1 = await hashPassword(password);
		const hash2 = await hashPassword(password);

		// Assert: Hashes should be different due to random salt
		expect(hash1).not.toBe(hash2);

		// But both should verify
		expect(await verifyPassword(password, hash1)).toBe(true);
		expect(await verifyPassword(password, hash2)).toBe(true);
	});

	it("should handle empty or invalid passwords gracefully", async () => {
		// Test edge cases that might break application

		// Empty password
		await expect(hashPassword("")).rejects.toThrow();

		// Test very long password
		const longPassword = "a".repeat(1000);
		const hash = await hashPassword(longPassword);
		expect(await verifyPassword(longPassword, hash)).toBe(true);
	});
});
