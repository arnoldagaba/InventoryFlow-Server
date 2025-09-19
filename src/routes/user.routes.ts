import { userController } from "#controllers/user.controller.js";
import { authmiddleware } from "#middleware/auth.middleware.js";
import { Router } from "express";

const router: Router = Router();
const { requireAuth } = authmiddleware;
const { getCurrentUser } = userController;

router.use(requireAuth);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information including role details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: "clx1234567890"
 *               email: "admin@inventoryflow.com"
 *               username: "admin"
 *               firstName: "System"
 *               lastName: "Administrator"
 *               isActive: true
 *               lastLoginAt: "2024-01-15T10:30:00.000Z"
 *               createdAt: "2024-01-01T00:00:00.000Z"
 *               updatedAt: "2024-01-15T10:30:00.000Z"
 *               role:
 *                 id: "role123"
 *                 name: "Admin"
 *                 description: "Full system access"
 *                 isActive: true
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_token:
 *                 summary: No authorization token
 *                 value:
 *                   error:
 *                     message: "Missing authorization token"
 *                     statusCode: 401
 *               invalid_token:
 *                 summary: Invalid or expired token
 *                 value:
 *                   error:
 *                     message: "Invalid access token"
 *                     statusCode: 401
 *               user_not_found:
 *                 summary: User not found or deactivated
 *                 value:
 *                   error:
 *                     message: "User not found or account deactivated"
 *                     statusCode: 401
 */
router.get("/me", getCurrentUser);

export default router;
