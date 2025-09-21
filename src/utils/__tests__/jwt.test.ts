import {
	extractTokenFromHeader,
	generateAccessToken,
	generateRefreshToken,
	verifyAccessToken,
	verifyRefreshToken,
} from "#utils/jwt.js";
import { describe, expect, it } from "vitest";

describe("JWT Token functions", () => {
	// Test data that represents a typical user
	const testUserId = "user-123";
	const testEmail = "test@example.com";
	const testRole = "Admin";

	describe("Token Generation", () => {
		it("should geneate a valid access token", async () => {
			// Act: Generate an access token
			const token = await generateAccessToken(testUserId, testEmail, testRole);

			// Assert: Check the token has expected structure
			expect(token).toBeTruthy();
			expect(typeof token).toBe("string");

			// JWTs have 3 parts separated by dots
			// header.payload.signature
			const tokenParts = token.split(".");

			expect(tokenParts).toHaveLength(3);

			// Each part should be base64 encoded
			tokenParts.forEach((part) => {
				expect(part).toMatch(/^[A-Za-z0-9_-]+=*$/);
			});
		});

		it("should generate a valid refresh token", async () => {
			// Act: Generate refresh token
			const token = await generateRefreshToken(testUserId);

			// Assert: Same structure as access token
			expect(token).toBeTruthy();
			expect(typeof token).toBe("string");

			// JWTs have 3 parts separated by dots
			// header.payload.signature
			const tokenParts = token.split(".");

			expect(tokenParts).toHaveLength(3);

			// Each part should be base64 encoded
			tokenParts.forEach((part) => {
				expect(part).toMatch(/^[A-Za-z0-9_-]+=*$/);
			});
		});

		it("should generate different tokens each time", async () => {
			// Act: Generate two tokens for same user
			const token1 = await generateAccessToken(testUserId, testEmail, testRole);
			const token2 = await generateAccessToken(testUserId, testEmail, testRole);

			// Assert: Tokens should be different (due to timestamp)
			expect(token1).not.toBe(token2);
		});
	});

	describe("Token verification", () => {
		it("should verify a valid access token", async () => {
			// Arrange: Create a token to verify
			const token = await generateAccessToken(testUserId, testEmail, testRole);

			// Act: Verify the token
			const payload = await verifyAccessToken(token);

			// Assert: Should return original user data
			expect(payload.userId).toBe(testUserId);
			expect(payload.email).toBe(testEmail);
			expect(payload.role).toBe(testRole);
			expect(payload.exp).toBeTruthy(); // Should have expiration time
			expect(payload.iat).toBeTruthy(); // Should have issued-at time
		});

		it("should verify a valid refresh token", async () => {
			// Arrange: Create a token to verify
			const token = await generateRefreshToken(testUserId);

			// Act: Verify the token
			const payload = await verifyRefreshToken(token);

			// Assert: Should return original user data
			expect(payload.userId).toBe(testUserId);
			expect(payload.exp).toBeTruthy(); // Should have expiration time
			expect(payload.iat).toBeTruthy(); // Should have issued-at time
		});

		it("should reject tampered tokens", async () => {
			// Arrange: Create a valid token then tamper with it
			const validToken = await generateAccessToken(testUserId, testEmail, testRole);
			const tamperedToken = validToken.slice(0, -5) + "ABCDE"; // Change last 5 characters

			// Act & Assert: Tampered token should be rejected
			await expect(verifyAccessToken(tamperedToken)).rejects.toThrow(/Invalid access token/);
		});

		it("should reject tokens with wrong secret", async () => {
			// Arrange: Create token, then change the secret
			const token = await generateAccessToken(testUserId, testEmail, testRole);

			// Temporarily change secret
			const originalSecret = process.env.JWT_ACCESS_SECRET;
			process.env.JWT_ACCESS_SECRET = "wrong-secret-key";

			try {
				// Act & Assert: Should fail with wrong secret
				await expect(verifyAccessToken(token)).rejects.toThrow(/Invalid access token/);
			} finally {
				// Restore original secret for other tests
				process.env.JWT_ACCESS_SECRET = originalSecret;
			}
		});
	});

	describe("Token Header Extraction", () => {
		it("should extract token from valid Bearer header", () => {
			// Arrange: Simulate the Authorizatio header format
			const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
			const authHeader = `Bearer ${token}`;

			// Act: Extract the token
			const extracted = extractTokenFromHeader(authHeader);

			// Assert: Should return just the token part
			expect(extracted).toBe(token);
		});

		it("should return null for missing header", () => {
			// Act: Try to extract from undefined header
			const extracted = extractTokenFromHeader(undefined);

			// Assert: Should handle gracefully
			expect(extracted).toBeNull();
		});

		it("should return null for nvalid header format", () => {
			// Test various malformed headers
			const invalidHeaders = [
				"InvalidFormat eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature",
				"Bearer",
				"Bearer ",
				"bearer token",
				"Basic dGVzdDp0ZXN0", // Different auth scheme
			];

			invalidHeaders.forEach((header) => {
				const extracted = extractTokenFromHeader(header);
				expect(extracted).toBeNull();
			});
		});
	});

	describe("Error Handling", () => {
		it("should handle expired tokens gracefully", async () => {
			const fakeExpiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid";
			await expect(verifyAccessToken(fakeExpiredToken)).rejects.toThrow();
		});

		it("should handle malformed tokens", async () => {
			const malformedTokens = [
				"not.a.jwt",
				"only-one-part",
				"too.many.parts.here.invalid",
				"",
				"null",
			];

			for (const badToken of malformedTokens) {
				await expect(verifyAccessToken(badToken)).rejects.toThrow();
			}
		});
	});
});
