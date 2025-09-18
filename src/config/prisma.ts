import { PrismaClient } from "#generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

import logger from "../utils/logger.js";
import { env } from "./env.js";

// create adapter with the connection string (required for driver adapters)
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// Create Prisma client instance — DO NOT supply `datasources` when using an adapter
const prisma = new PrismaClient({
	// attach the adapter only
	adapter,

	// error formatting
	errorFormat: "pretty",

	// log configuration
	log: env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["warn", "error"],
});

// Health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		logger.info("Database health check passed");
		return true;
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : "Unknown database error",
				event: "database_health_check_failed",
			},
			"Database health check failed"
		);
		return false;
	}
};

// Graceful disconnect
export const disconnectDatabase = async (): Promise<void> => {
	try {
		await prisma.$disconnect();
		logger.info("Database disconnected successfully");
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : "Unknown error",
				event: "database_disconnect_failed",
			},
			"Failed to disconnect from database"
		);
	}
};

export type {
	Attachment,
	AuditLog,
	Category,
	InventoryItem,
	InventoryVariant,
	Location,
	PurchaseOrder,
	PurchaseOrderLine,
	Role,
	RolePermission,
	SalesOrder,
	SalesOrderLine,
	Setting,
	StockLevel,
	StockTransaction,
} from "#generated/prisma/client.js";

export default prisma;
