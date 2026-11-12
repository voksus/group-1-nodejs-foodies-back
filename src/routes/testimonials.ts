import { Router } from "express";
import { getTestimonials } from "../controllers/testimonials.ts";
import { ErrorResponseSchema, registry } from "../openapi.ts";
import { TestimonialsResponseSchema } from "../schemas/testimonials.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

const testimonialsRouter = Router();

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
    500: {
      description: "Internal server error",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

testimonialsRouter.get("/", ctrlWrapper(getTestimonials));

export default testimonialsRouter;
