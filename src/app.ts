import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.ts";
import { logger } from "./logger.ts";
import { errorHandler } from "./middlewares/errorHandler.ts";
import { notFoundHandler } from "./middlewares/notFoundHandler.ts";
import { generateOpenApiDocument } from "./openapi.ts";
import apiRouter from "./routes/index.ts";

const app = express();

app.use(pinoHttp({ logger }));

app.use(
  cors({
    origin: env.allowedOriginsList,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  (
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const openApiDoc = generateOpenApiDocument();
    return swaggerUi.setup(openApiDoc)(_req, res, next);
  },
);

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
