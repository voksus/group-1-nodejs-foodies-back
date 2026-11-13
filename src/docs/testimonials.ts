import { registry } from "../openapi.ts";
import { TestimonialsResponseSchema } from "../schemas/testimonialsSchemas.ts";

registry.registerPath({
  method: "get",
  path: "/api/testimonials",
  tags: ["Testimonials"],
  summary: "Get the list of testimonials with their authors",
  responses: {
    200: {
      description: "List of testimonials",
      content: {
        "application/json": { schema: TestimonialsResponseSchema },
      },
    },
  },
});
