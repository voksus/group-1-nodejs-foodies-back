import { z } from "zod";
import { registry } from "../openapi.ts";

export const TestimonialOwnerSchema = z.object({
  id: z.string().openapi({
    description: "Author ID",
    example: "64c8d958249fae54bae90bb9",
  }),
  name: z.string().openapi({
    description: "Author display name",
    example: "Ilya",
  }),
  avatar: z.string().nullable().openapi({
    description: "Author avatar URL, null if not set",
    example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
  }),
});

export const TestimonialSchema = z.object({
  id: z.string().openapi({
    description: "Testimonial ID",
    example: "647495d0c825f1570b04182d",
  }),
  testimonial: z.string().openapi({
    description: "Testimonial text",
    example: "Foodies has transformed my cooking experience!",
  }),
  owner: TestimonialOwnerSchema,
});

export const TestimonialsResponseSchema = registry.register(
  "TestimonialsResponse",
  z.array(TestimonialSchema),
);
