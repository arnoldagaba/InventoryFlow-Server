import { Router } from "express";

import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import userRoutes from "./user.routes.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: System health and status endpoints
 *   - name: Authentication
 *     description: User authentication and token management
 *   - name: Users
 *     description: User profile and account management
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     description: Welcome message and API information
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 docs:
 *                   type: string
 */
router.get("/", (req, res) => {
	res.json({
		message: "InventoryFlow API",
		version: "1.0.0",
		docs: "/api-docs"
	});
});

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
