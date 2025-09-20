import { authController } from "#controllers/auth.controller.js";
import { authmiddleware } from "#middleware/auth.middleware.js";
import { Router } from "express";

const router: Router = Router();

const { login, logout, refreshToken } = authController;
const { optionalAuth, requireAuth } = authmiddleware;

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User authentication
 *     description: Authenticate user with email/username and password. Returns access token and sets refresh token as httpOnly cookie.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: Refresh token as httpOnly cookie
 *             schema:
 *               type: string
 *               example: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 message: "Validation error: Password must contain at least one uppercase letter"
 *                 statusCode: 400
 *       401:
 *         description: Invalid credentials or account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 message: "Invalid credentials provided"
 *                 statusCode: 401
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh authentication tokens
 *     description: Generate new access and refresh tokens using the refresh token from httpOnly cookie
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: New refresh token as httpOnly cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *       401:
 *         description: No refresh token provided or invalid/expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_token:
 *                 summary: No refresh token
 *                 value:
 *                   error:
 *                     message: "No refresh token provided"
 *                     statusCode: 401
 *               invalid_token:
 *                 summary: Invalid or expired token
 *                 value:
 *                   error:
 *                     message: "Invalid refresh token"
 *                     statusCode: 401
 */
router.post("/refresh", requireAuth, refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout authenticated user by clearing refresh token cookie and logging the event
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         headers:
 *           Set-Cookie:
 *             description: Clears refresh token cookie
 *             schema:
 *               type: string
 *               example: refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *                 success:
 *                   type: boolean
 *                   example: true
 */
router.post("/logout", optionalAuth, logout);

export default router;
