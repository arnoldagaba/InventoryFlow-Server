import { afterAll, beforeAll, beforeEach } from "vitest";

beforeAll(() => {
	process.env.NODE_ENV = "test";
	process.env.DATABASE_URL =
		process.env.DATABASE_URL ?? "postgresql://aynard:postgres123@localhost:5432/testdb";
	process.env.PORT = "3001";
	process.env.JWT_ACCESS_SECRET = "e4f23c151130cb82a5a54058f0ab8438";
	process.env.JWT_REFRESH_SECRET = "9dbced9cb92c26c4b1e81dd856fd9547";
	process.env.ACCESS_TOKEN_EXPIRY = "15m";
	process.env.REFRESH_TOKEN_EXPIRY = "7d";
	process.env.ALLOWED_ORIGINS = "http://localhost:5173,http://localhost:5174";

	console.info("Test environment configured");
});

afterAll(() => {
	console.log("Test cleanup completed");
});

beforeEach(() => {
	// This ensures each test starts with a clean slate
	// TODO: Add any clean up logic here as tests become more complex
});
