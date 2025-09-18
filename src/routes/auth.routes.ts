import { authController } from "#controllers/auth.controller.js";
import { Router } from "express";

const router: Router = Router();

const { login, refreshToken } = authController;

router.post("/login", login);
router.post("/refresh", refreshToken);

export default router;
