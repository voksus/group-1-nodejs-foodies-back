import app from "./app.ts";
import { env } from "./config/env.ts";
import { logger } from "./logger.ts";

const server = app.listen(env.PORT, () => {
  logger.info(`Server is running on http://localhost:${env.PORT}`);
  logger.info(
    `Swagger docs available at http://localhost:${env.PORT}/api-docs`,
  );
});

const shutdown = (signal: string): void => {
  logger.info(`Received ${signal}. Closing HTTP server...`);
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
