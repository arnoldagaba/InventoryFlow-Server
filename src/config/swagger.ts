import swaggerJSDoc from "swagger-jsdoc";

import { env } from "./env.js";

const options: swaggerJSDoc.Options = {
	apis: ["./src/routes/*.ts"],
	definition: {
		components: {
			schemas: {
				ErrorResponse: {
					properties: {
						error: {
							properties: {
								message: { type: "string" },
								stack: { items: { type: "string" }, type: "array" },
								statusCode: { type: "number" },
							},
							type: "object",
						},
					},
					type: "object",
				},
				HealthResponse: {
					properties: {
						database: { enum: ["healthy", "unhealthy"], type: "string" },
						status: { example: "ok", type: "string" },
						timestamp: { format: "date-time", type: "string" },
					},
					type: "object",
				},
				LoginRequest: {
					properties: {
						identifier: {
							description: "Email or username",
							example: "admin@inventoryflow.com",
							type: "string",
						},
						password: {
							description: "User password",
							example: "SecureAdmin123!",
							format: "password",
							type: "string",
						},
					},
					required: ["identifier", "password"],
					type: "object",
				},
				LoginResponse: {
					properties: {
						accessToken: { type: "string" },
						message: { example: "Login successful", type: "string" },
						success: { example: true, type: "boolean" },
						user: { $ref: "#/components/schemas/User" },
					},
					type: "object",
				},
				RefreshResponse: {
					properties: {
						accessToken: { type: "string" },
						message: { example: "Token refreshed successfully", type: "string" },
						success: { example: true, type: "boolean" },
						user: { $ref: "#/components/schemas/User" },
					},
					type: "object",
				},
				Role: {
					properties: {
						description: { nullable: true, type: "string" },
						id: { type: "string" },
						isActive: { type: "boolean" },
						name: { type: "string" },
					},
					type: "object",
				},
				User: {
					properties: {
						createdAt: { format: "date-time", type: "string" },
						email: { format: "email", type: "string" },
						firstName: { type: "string" },
						id: { type: "string" },
						isActive: { type: "boolean" },
						lastLoginAt: { format: "date-time", nullable: true, type: "string" },
						lastName: { type: "string" },
						role: { $ref: "#/components/schemas/Role" },
						updatedAt: { format: "date-time", type: "string" },
						username: { type: "string" },
					},
					type: "object",
				},
			},
			securitySchemes: {
				bearerAuth: {
					bearerFormat: "JWT",
					scheme: "bearer",
					type: "http",
				},
			},
		},
		info: {
			contact: {
				email: "admin@inventoryflow.com",
				name: "Arnold Agaba",
			},
			description: "Comprehensive Inventory Management System API",
			title: "InventoryFlow API",
			version: "1.0.0",
		},
		openapi: "3.0.0",
		security: [{ bearerAuth: [] }],
		servers: [
			{
				description: "Development server",
				url: `http://localhost:${String(env.PORT)}/api`,
			},
		],
	},
};

export const swaggerSpec = swaggerJSDoc(options);