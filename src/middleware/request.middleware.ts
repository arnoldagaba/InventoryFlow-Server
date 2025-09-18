import type { Request, Response } from "express";

import logger from "#utils/logger.js";
import { pinoHttp } from "pino-http";

export const httpLogger = pinoHttp({
	logger,
	serializers: {
		req: (req: Request) => ({
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
		}),
		res: (res: Response) => ({
			headers: {
				"content-length": res.get("content-length"),
				"content-type": res.get("content-type"),
			},
			statusCode: res.statusCode,
		}),
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
