import { ErrorResponseSchema, registry } from "../openapi.ts";
import {
  FavoriteActionResponseSchema,
  FavoriteRecipeParamsSchema,
  FavoritesQuerySchema,
} from "../schemas/favoritesSchemas.ts";
import { PaginatedRecipesSchema } from "../schemas/recipesSchemas.ts";
import { errorResponses } from "./errorResponses.ts";
import { authenticatedSecurity } from "./security.ts";

const errors = {
  ...errorResponses,
  401: {
    ...errorResponses[401],
    description:
      "Authentication is required. The access token is missing, invalid, expired, or belongs to a deleted user.",
  },
};

registry.registerPath({
  method: "get",
  path: "/api/recipes/favorites",
  tags: ["Recipes"],
  summary: "Get the current user's favorite recipes",
  description:
    "Returns only the authenticated user's favorites as RecipeCard items with isFavorite: true. Ordered by recipe creation date descending, then ID ascending. Empty results and out-of-range pages have an empty items array. totalPages is at least 1, matching the shared pagination helper.",
  security: authenticatedSecurity,
  request: { query: FavoritesQuerySchema },
  responses: {
    200: {
      description: "A paginated list of the current user's favorite recipes.",
      content: { "application/json": { schema: PaginatedRecipesSchema } },
    },
    ...errors,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/recipes/{id}/favorite",
  tags: ["Recipes"],
  summary: "Add a recipe to the current user's favorites",
  description:
    "Idempotent: both a new favorite and an existing favorite return 200. Does not affect other users' favorites.",
  security: authenticatedSecurity,
  request: { params: FavoriteRecipeParamsSchema },
  responses: {
    200: {
      description: "The recipe is in the current user's favorites.",
      content: { "application/json": { schema: FavoriteActionResponseSchema } },
    },
    404: {
      description: "Recipe not found.",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    ...errors,
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/recipes/{id}/favorite",
  tags: ["Recipes"],
  summary: "Remove a recipe from the current user's favorites",
  description:
    "Returns 200 even if the favorite or recipe no longer exists. Does not delete the recipe or affect other users' favorites.",
  security: authenticatedSecurity,
  request: { params: FavoriteRecipeParamsSchema },
  responses: {
    200: {
      description: "The recipe is absent from the current user's favorites.",
      content: { "application/json": { schema: FavoriteActionResponseSchema } },
    },
    ...errors,
  },
});
