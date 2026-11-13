import { PaginationQuerySchema, registry } from "../openapi.ts";
import { z } from "../utils/zod.ts";
import { createPositiveIntegerQuerySchema, IdSchema } from "./commonSchemas.ts";

export const FavoritesQuerySchema = PaginationQuerySchema.extend({
  limit: createPositiveIntegerQuerySchema(9, 100).openapi({
    description: "Favorite recipes per page, from 1 to 100.",
    example: 9,
  }),
});

export const FavoriteRecipeParamsSchema = z.object({
  id: IdSchema.openapi({
    description: "Recipe ID: an original 24-character hex ID or a UUID.",
    example: "6462a8f74c3d0ddd28898098",
  }),
});

export const FavoriteActionResponseSchema = registry.register(
  "FavoriteActionResponse",
  z.object({ message: z.string() }),
);

export type FavoritesQuery = z.infer<typeof FavoritesQuerySchema>;
export type FavoriteRecipeParams = z.infer<typeof FavoriteRecipeParamsSchema>;
