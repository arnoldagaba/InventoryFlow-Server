import type { Request, Response } from "express";

import logger from "#utils/logger.js";
import { pinoHttp } from "pino-http";

export const httpLogger = pinoHttp({
	logger,
	serializers: {
		req: (req: Request) => {
			// Safety check to ensure req has the get method
			if (typeof req.get !== "function") {
				return {
					id: req.id,
					method: req.method,
					url: req.url,
				};
			}

			return {
				headers: {
					authorization: req.get("authorization") ? "[REDACTED]" : undefined,
					host: req.get("host"),
					"user-agent": req.get("user-agent"),
				},
				id: req.id,
				method: req.method,
				remoteAdress: req.socket.remoteAddress,
				remotePort: req.socket.remotePort,
				url: req.url,
			};
		},
		res: (res: Response) => {
			// Safety check to ensure res has the get method
			if (typeof res.get !== 'function') {
				return {
					statusCode: res.statusCode,
				};
			}
			
			return {
				headers: {
					"content-length": res.get("content-length"),
					"content-type": res.get("content-type"),
				},
				statusCode: res.statusCode,
			};
		},
	},
});

// Utility function to add request specific context to child loggers
export const getRequestLogger = (req: Request) => {
	return logger.child({
		method: req.method,
		requestId: req.id,
		url: req.url,
	});
};
