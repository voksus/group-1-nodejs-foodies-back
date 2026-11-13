import { z } from "zod";

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

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;
