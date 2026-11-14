import { z } from "zod";
import { registry } from "../openapi.ts";

export const AreaSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier of the area",
    example: "6462a6f04c3d0ddd28897f9b",
  }),
  name: z.string().openapi({
    description: "Name of the culinary area or region",
    example: "Ukrainian",
  }),
});

export const AreasResponseSchema = registry.register(
  "AreasResponse",
  z.array(AreaSchema),
);
