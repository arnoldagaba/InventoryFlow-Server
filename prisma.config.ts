import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

export default defineConfig({
	migrations: {
		path: path.join("prisma", "migrations"),
		seed: "tsx prisma/seed.ts",
	},
	schema: path.join("prisma", "schema.prisma"),
});
