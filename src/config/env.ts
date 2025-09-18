import { z } from "zod/v4";

const envSchema = z.object({
	ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
	ALLOWED_ORIGINS: z.string().default("http://localhost:5173,http://localhost:5174"),
	DATABASE_URL: z.url(),
	JWT_ACCESS_SECRET: z.string(),
	JWT_REFRESH_SECRET: z.string(),
	NODE_ENV: z.enum(["development", "production"]).default("development"),
	PORT: z.coerce.number().default(3000),
	REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
	const message = _env.error.issues.map((issue) => issue.message).join("\n");
	console.info("Invalid environment variables: ", message);
	process.exit(1);
}

export type Env = z.infer<typeof envSchema>;
export const env = _env.data;
