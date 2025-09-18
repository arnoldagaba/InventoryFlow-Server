import "express";

declare global {
	namespace Express {
		interface Request {
			user: {
				email: string;
				id: string;
				name: string;
				role: string;
			};
		}
	}
}
