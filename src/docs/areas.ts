import { registry } from "../openapi.ts";
import { AreasResponseSchema } from "../schemas/areasSchemas.ts";

registry.registerPath({
  method: "get",
  path: "/api/areas",
  tags: ["Areas"],
  summary: "Get all areas",
  description: "Returns a complete list of unique dish origin areas.",
  responses: {
    200: {
      description: "Array of area objects",
      content: {
        "application/json": { schema: AreasResponseSchema },
      },
    },
  },
});
