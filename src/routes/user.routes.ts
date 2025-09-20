import { userController } from "#controllers/user.controller.js";
import { authmiddleware } from "#middleware/auth.middleware.js";
import { Router } from "express";

const router: Router = Router();
const { requireAuth, requirePermission, requireRole } = authmiddleware;
const { getAllUsers, getCurrentUser, getSpecificUser, registerUser } = userController;

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

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users in the system. Requires USERS_VIEW permission.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *             example:
 *               - id: "clx1234567890"
 *                 email: "admin@inventoryflow.com"
 *                 username: "admin"
 *                 firstName: "System"
 *                 lastName: "Administrator"
 *                 isActive: true
 *                 lastLoginAt: "2024-01-15T10:30:00.000Z"
 *                 createdAt: "2024-01-01T00:00:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *                 role:
 *                   id: "role123"
 *                   name: "Admin"
 *                   description: "Full system access"
 *                   isActive: true
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions (USERS_VIEW permission required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 message: "You don't have permission to users view"
 *                 statusCode: 403
 */
router.get("/", requirePermission("USERS_VIEW"), getAllUsers);

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account. Requires USERS_CREATE permission. The action is logged in the audit trail.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - firstName
 *               - lastName
 *               - roleId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@inventoryflow.com"
 *               username:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$"
 *                 example: "SecurePass123!"
 *                 description: "Must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: "Doe"
 *               roleId:
 *                 type: string
 *                 example: "clx1234567890"
 *                 description: "ID of the role to assign to the user"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or duplicate email/username
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation_error:
 *                 summary: Validation failed
 *                 value:
 *                   error:
 *                     message: "Validation error: Password must contain at least one uppercase letter"
 *                     statusCode: 400
 *               duplicate_email:
 *                 summary: Email already exists
 *                 value:
 *                   error:
 *                     message: "Email address is already registered"
 *                     statusCode: 409
 *               duplicate_username:
 *                 summary: Username already taken
 *                 value:
 *                   error:
 *                     message: "Username is already taken"
 *                     statusCode: 409
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions (USERS_CREATE permission required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 message: "You don't have permission to users create"
 *                 statusCode: 403
 */
router.post("/register", requireRole(["Admin"]), registerUser);

/**
 * @swagger
 * /users/:id:
 *   get:
 *     summary: Get a specific user
 *     description: Retrieve a users in the system. Requires USERS_VIEW permission.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/User'
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
 *       403:
 *         description: Insufficient permissions (USERS_VIEW permission required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 message: "You don't have permission to users view"
 *                 statusCode: 403
 */
router.get("/:id", requirePermission("USERS_VIEW"), getSpecificUser);

export default router;
