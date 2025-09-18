import prisma from "#config/prisma.js";
import { AuditAction } from "#generated/prisma/client.js";
import logger from "#utils/logger.js";

/**
 * Log user authentication events
 */
export async function logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
	try {
		await prisma.auditLog.create({
			data: {
				action: AuditAction.LOGIN,
				entityId: userId,
				entityType: "User",
				ipAddress,
				userAgent,
				userId,
			},
		});
	} catch (error) {
		logger.error({ error, userId }, "Failed to log login audit");
	}
}

/**
 * Log user logout events
 */
export async function logLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
	try {
		await prisma.auditLog.create({
			data: {
				action: AuditAction.LOGOUT,
				entityId: userId,
				entityType: "User",
				ipAddress,
				userAgent,
				userId,
			},
		});
	} catch (error) {
		logger.error({ error, userId }, "Failed to log logout audit");
	}
}

/**
 * Log user creation events
 */
export async function logUserCreation(
	userId: string,
	email: string,
	userName: string,
	createdByUserId: string,
	firstName?: string,
	lastName?: string,
	ipAddress?: string,
	userAgent?: string
): Promise<void> {
	try {
		await prisma.auditLog.create({
			data: {
				action: AuditAction.CREATE,
				entityId: userId,
				entityType: "User",
				ipAddress,
				newValues: {
					email,
					firstName,
					lastName,
					username: userName,
				},
				userAgent,
				userId: createdByUserId,
			},
		});
	} catch (error) {
		logger.error({ error }, "Failed to log user creation audit");
	}
}
