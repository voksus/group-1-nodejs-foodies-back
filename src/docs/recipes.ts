import { z } from "zod";
import { ErrorResponseSchema, registry } from "../openapi.ts";

const RecipeIngredientSchema = registry.register(
  "RecipeIngredient",
  z.object({
    id: z.string().openapi({ example: "6462a8f74c3d0ddd28897fcd" }),
    name: z.string().openapi({ example: "Avocado" }),
    img: z.string().nullable(),
    measure: z.string().nullable().openapi({ example: "3" }),
  }),
);

const RecipeSchema = registry.register(
  "Recipe",
  z.object({
    id: z.string().openapi({ example: "3f9c1e7a-2b4d-4c8e-9a1f-6d5b7e8c9a0b" }),
    title: z.string().openapi({ example: "Salmon avocado salad" }),
    description: z.string().nullable(),
    instructions: z.string(),
    time: z.number().int().nullable().openapi({ example: 40 }),
    thumb: z.string().nullable(),
    ownerId: z.string(),
    category: z.object({ id: z.string(), name: z.string() }),
    area: z.object({ id: z.string(), name: z.string() }),
    ingredients: z.array(RecipeIngredientSchema),
    createdAt: z.string().openapi({ format: "date-time" }),
    updatedAt: z.string().openapi({ format: "date-time" }),
  }),
);

const CreateRecipeMultipartSchema = registry.register(
  "CreateRecipeMultipart",
  z.object({
    title: z.string().openapi({ example: "Salmon avocado salad" }),
    description: z
      .string()
      .openapi({ example: "A healthy salad with salmon and avocado." }),
    instructions: z.string(),
    categoryId: z.string().openapi({ example: "6462a8f74c3d0ddd28897fcd" }),
    areaId: z.string().openapi({ example: "6462a8f74c3d0ddd28897fcd" }),
    time: z.string().openapi({
      example: "40",
      description: "Minutes, 1–1440",
    }),
    ingredients: z.string().openapi({
      example: '[{"id":"6462a8f74c3d0ddd28897fcd","measure":"400 g"}]',
      description:
        "JSON array of { id, measure }. Each ingredient at least once.",
    }),
    thumb: z.string().openapi({
      format: "binary",
      description: "JPEG, PNG or WebP, max 5 MB",
    }),
  }),
);

registry.registerPath({
  method: "post",
  path: "/api/recipes",
  tags: ["Recipes"],
  summary: "Create a recipe",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": { schema: CreateRecipeMultipartSchema },
      },
    },
  },
  responses: {
    201: {
      description: "Recipe created",
      content: { "application/json": { schema: RecipeSchema } },
    },
    400: {
      description:
        "Validation error, missing image, or unknown category, area, or ingredient ID",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/recipes/{id}",
  tags: ["Recipes"],
  summary: "Delete own recipe",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z
        .string()
        .openapi({ example: "3f9c1e7a-2b4d-4c8e-9a1f-6d5b7e8c9a0b" }),
    }),
  },
  responses: {
    204: { description: "Recipe deleted" },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Recipe belongs to another user",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Recipe not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
