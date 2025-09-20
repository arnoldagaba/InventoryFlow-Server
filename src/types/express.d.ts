import "express";

declare global {
	namespace Express {
		interface Request {
			user?: {
				email: string;
				id: string;
				role: { 
					id: string; 
					name: string;
					permissions: { permission: string }[];
				};
				username: string;
			};
		}
	}
}
