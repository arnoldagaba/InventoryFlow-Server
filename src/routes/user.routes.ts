import { userController } from "#controllers/user.controller.js";
import { authmiddleware } from "#middleware/auth.middleware.js";
import { Router } from "express";

const router: Router = Router();
const { requireAuth } = authmiddleware;
const { getCurrentUser } = userController;

router.use(requireAuth);

router.get("/me", getCurrentUser);

export default router;
