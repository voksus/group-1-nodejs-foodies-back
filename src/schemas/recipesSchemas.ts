import { z } from "zod";
import {
  createPaginatedSchema,
  PaginationQuerySchema,
  registry,
} from "../openapi.ts";
import { createPositiveIntegerQuerySchema, IdSchema } from "./commonSchemas.ts";

const recipeIngredientSchema = z.object({
  id: z.string().min(1).max(36),
  measure: z.string().trim().min(1).max(100),
});

const ingredientsFieldSchema = z
  .string()
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "ingredients must be a JSON array",
      });
      return z.NEVER;
    }
  })
  .pipe(
    z
      .array(recipeIngredientSchema)
      .min(1, "At least one ingredient is required")
      .refine(
        (items) => new Set(items.map((item) => item.id)).size === items.length,
        "Each ingredient can be used only once",
      ),
  );

const cookingTimeSchema = z.coerce.number().int().min(1).max(1440);

export const CreateRecipeSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(1).max(200),
  instructions: z.string().trim().min(1).max(1000),
  categoryId: z.string().min(1).max(36),
  areaId: z.string().min(1).max(36),
  time: cookingTimeSchema,
  ingredients: ingredientsFieldSchema,
});

export const RecipeIdParamsSchema = z.object({
  id: z.string().min(1).max(36),
});

const filterSchema = z.string().trim().min(1);

export const RecipesQuerySchema = PaginationQuerySchema.extend({
  category: filterSchema.optional().openapi({
    description:
      "Category ID or exact name (case-insensitive). Omit, or use 'all' / 'всі', for all categories.",
    example: "Seafood",
  }),
  ingredient: IdSchema.optional().openapi({
    description: "Ingredient ID: an original 24-character hex ID or a UUID.",
    example: "640c2dd963a319ea671e372c",
  }),
  area: filterSchema.optional().openapi({
    description: "Area ID or exact name (case-insensitive).",
    example: "Italian",
  }),
  limit: PaginationQuerySchema.shape.limit.openapi({
    description: "Recipes per page, from 1 to 100.",
    example: 12,
  }),
});

export const PopularRecipesQuerySchema = z.object({
  limit: createPositiveIntegerQuerySchema(4, 50).openapi({
    description: "Maximum number of popular recipes, from 1 to 50.",
    example: 4,
  }),
});

export const RecipeCardSchema = registry.register(
  "RecipeCard",
  z.object({
    id: z.string().openapi({ example: "6462a8f74c3d0ddd28898098" }),
    title: z.string().openapi({ example: "Chakchouka" }),
    description: z.string().nullable(),
    thumb: z.string().nullable(),
    time: z.number().int().nullable().openapi({
      description: "Cooking time in minutes; null if not provided.",
      example: 30,
    }),
    owner: z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().nullable(),
    }),
    isFavorite: z.boolean().openapi({
      description:
        "Whether the authenticated user saved this recipe. Always false for guests.",
      example: false,
    }),
  }),
);

export const PaginatedRecipesSchema = createPaginatedSchema(
  RecipeCardSchema,
  "PaginatedRecipes",
);

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;
export type RecipesQuery = z.infer<typeof RecipesQuerySchema>;
export type PopularRecipesQuery = z.infer<typeof PopularRecipesQuerySchema>;
export type RecipeCard = z.infer<typeof RecipeCardSchema>;
