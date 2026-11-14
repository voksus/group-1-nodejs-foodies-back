import { registry } from "../openapi.ts";
import { AreasResponseSchema } from "../schemas/areasSchemas.ts";

registry.registerPath({
  method: "get",
  path: "/api/areas",
  tags: ["Areas"],
  summary: "Отримати список усіх регіонів",
  description: "Повертає повний список регіонів походження страв без дублікатів.",
  responses: {
    200: {
      description: "Масив об'єктів регіонів",
      content: {
        "application/json": { schema: AreasResponseSchema },
      },
    },
  },
});