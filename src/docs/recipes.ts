import { registry } from "../openapi.ts";
import {
  PaginatedRecipesSchema,
  PopularRecipesQuerySchema,
  RecipeCardSchema,
  RecipesQuerySchema,
} from "../schemas/recipesSchemas.ts";
import { z } from "../utils/zod.ts";
import { errorResponses } from "./errorResponses.ts";
import { optionalSecurity } from "./security.ts";

registry.registerPath({
  method: "get",
  path: "/api/recipes",
  tags: ["Recipes"],
  summary: "Search recipes with server-side pagination",
  description:
    "Category, ingredient and area filters are combined with AND. Category and area accept an ID or an exact, case-insensitive name. Recipes are ordered by creation date descending, then ID ascending. An unknown filter or an out-of-range page returns an empty items array. totalPages is at least 1, following the shared API pagination helper. Authentication is optional; use a Bearer access token or the accessToken cookie to receive isFavorite values.",
  security: optionalSecurity,
  request: { query: RecipesQuerySchema },
  responses: {
    200: {
      description: "A paginated list of recipe cards.",
      content: { "application/json": { schema: PaginatedRecipesSchema } },
    },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/recipes/popular",
  tags: ["Recipes"],
  summary: "Get popular recipes",
  description:
    "Ordered by the number of favorites descending, then ID ascending to resolve ties. Recipes without favorites are included when needed to fill the requested limit. Authentication is optional; isFavorite refers only to the current user.",
  security: optionalSecurity,
  request: { query: PopularRecipesQuerySchema },
  responses: {
    200: {
      description: "An array of recipe cards, without a pagination wrapper.",
      content: { "application/json": { schema: z.array(RecipeCardSchema) } },
    },
    ...errorResponses,
  },
});
