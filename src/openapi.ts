import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const bearerAuth = registry.registerComponent(
  "securitySchemes",
  "bearerAuth",
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "JWT Access Token in Authorization header (Bearer <token>)",
  },
);

export const cookieAuth = registry.registerComponent(
  "securitySchemes",
  "cookieAuth",
  {
    type: "apiKey",
    in: "cookie",
    name: "accessToken",
    description: "HTTP-only cookie containing JWT Access Token",
  },
);

export const ErrorResponseSchema = registry.register(
  "ErrorResponse",
  z.object({
    message: z.string().openapi({ example: "Validation error" }),
    errors: z
      .array(
        z.object({
          path: z.string().openapi({ example: "email" }),
          message: z.string().openapi({ example: "Invalid email address" }),
        }),
      )
      .optional(),
  }),
);

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(12)
    .openapi({ example: 12 }),
});

export const createPaginatedSchema = <T extends z.ZodType>(
  itemSchema: T,
  schemaName: string,
) => {
  return registry.register(
    schemaName,
    z.object({
      items: z.array(itemSchema),
      total: z.number().int().openapi({ example: 48 }),
      page: z.number().int().openapi({ example: 1 }),
      limit: z.number().int().openapi({ example: 12 }),
      totalPages: z.number().int().openapi({ example: 4 }),
    }),
  );
};

registry.registerPath({
  method: "get",
  path: "/api/health",
  tags: ["System"],
  summary: "Перевірка стану сервера (Healthcheck)",
  responses: {
    200: {
      description: "Сервер працює штатно",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "ok" }),
            timestamp: z
              .string()
              .openapi({ example: "2026-11-11T12:00:00.000Z" }),
          }),
        },
      },
    },
  },
});

export const generateOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Foodies REST API",
      version: "1.0.0",
      description:
        "Автоматично згенерована документація Foodies API (Zod + @asteasolutions/zod-to-openapi).",
    },
    servers: [{ url: "/", description: "Current Server" }],
  });
};
