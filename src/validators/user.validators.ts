import { z } from "zod";

import { emailSchema, passwordSchema } from "./auth.validators.js";

export const registerSchema = z.object({
    email: emailSchema,
    firstName: z
        .string()
        .min(1, "First name is required")
        .max(50, "First name must be less than 50 characters")
        .trim(),
    lastName: z
        .string()
        .min(1, "Last name is required")
        .max(50, "Last name must be less than 50 characters")
        .trim(),
    password: passwordSchema,
    roleId: z.string().min(1, "Role ID is required"),
    username: z
        .string()
        .min(1, "Username is required")
        .max(50, "Username must be less than 50 characters")
        .trim(),
});
export type RegisterDTO = z.infer<typeof registerSchema>;