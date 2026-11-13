import app from "./app.ts";
import { env } from "./config/env.ts";

const server = app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
  console.log(
    `Swagger docs available at http://localhost:${env.PORT}/api-docs`,
  );
});

const shutdown = (signal: string): void => {
  console.log(`Received ${signal}. Closing HTTP server...`);
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
