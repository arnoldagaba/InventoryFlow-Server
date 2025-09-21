import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./src/test/setup.ts"],
		include: ["./src/**/__tests__/**/*.{js,ts}"],
		exclude: ["node_modules/**", "dist/**"],
		testTimeout: 10_000,
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			reportsDirectory: "./coverage",
			exclude: [
				"node_modules",
				"dist",
				"coverage",
				"src/test",
				"**/*.d.ts",
				"**/*.config.*",
				"src/generated/**",
			],
			thresholds: {
				global: {
					branches: 60,
					functions: 60,
					lines: 60,
					statements: 60,
				},
			},
		},
	},

	resolve: {
		alias: {
			"#config": path.resolve(__dirname, "./src/config"),
			"#controllers": path.resolve(__dirname, "./src/controllers"),
			"#errors": path.resolve(__dirname, "./src/errors"),
			"#middleware": path.resolve(__dirname, "./src/middleware"),
			"#routes": path.resolve(__dirname, "./src/routes"),
			"#services": path.resolve(__dirname, "./src/services"),
			"#types": path.resolve(__dirname, "./src/types"),
			"#utils": path.resolve(__dirname, "./src/utils"),
			"#validators": path.resolve(__dirname, "./src/validators"),
			"#genrated": path.resolve(__dirname, "./src/generated"),
		},
	},
});
