import { env } from "#config/env.js";
import { hostname } from "os";
import path from "path";
import pino, { Logger, LoggerOptions, StreamEntry, TransportTargetOptions } from "pino";
import { createStream } from "rotating-file-stream";

const isDevelopment = env.NODE_ENV === "development";
const isProduction = env.NODE_ENV === "production";

// Rotating file stream for log files
const createLogStream = () => {
	const logDirectory = path.join(process.cwd(), "logs");

	return createStream("app.log", {
		compress: "gzip",
		interval: "1d",
		maxFiles: 30,
		path: logDirectory,
	});
};

const createLogger = (): Logger => {
	const baseConfig: LoggerOptions = {
		base: {
			hostname: hostname(),
			pid: process.pid,
		},
		level: isDevelopment ? "debug" : "info",
		name: "InventoryFlow",
		serializers: {
			err: pino.stdSerializers.err,
			req: pino.stdSerializers.req,
			res: pino.stdSerializers.res,
		},
		timestamp: pino.stdTimeFunctions.isoTime,
	};

	if (isDevelopment) {
		const transport: TransportTargetOptions = {
			options: {
				colorize: true,
				ignore: "pid,hostname",
				translateTime: "SYS:standard",
			},
			target: "pino-pretty",
		};
		return pino(baseConfig, pino.transport(transport) as pino.DestinationStream);
	}

	if (isProduction) {
		const streams: StreamEntry[] = [];
		streams.push({ level: "info", stream: createLogStream() });

		return pino(baseConfig, pino.multistream(streams));
	}

	// Default configuration
	return pino(baseConfig);
};

const logger: Logger = createLogger();

export default logger;
