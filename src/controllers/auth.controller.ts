import { asyncHandler } from "#middleware/error.middleware.js";
import { loginSchema } from "#validators/auth.validators.js";
import { NextFunction, Request, Response } from "express";

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
	const data = loginSchema.parse(req.body);
    
});
