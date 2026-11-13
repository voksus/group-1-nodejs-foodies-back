import { randomUUID } from "node:crypto";
import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../db.ts";
import type {
  CreateRecipeInput,
  RecipeCard,
  RecipesQuery
} from "../schemas/recipesSchemas.ts";
import { destroyImage, uploadImage } from "./cloudinaryService.ts";
import {
  formatPaginatedResponse,
  getPaginationParams,
} from "../utils/pagination.ts";

const recipeImagePublicId = (recipeId: string): string => `recipes/${recipeId}`;

export interface ReferenceIssue {
    path: string;
    message: string;
}

const recipeInclude = {
    category: { select: { id: true, name: true } },
    area: { select: { id: true, name: true } },
    ingredients: {
        select: {
            measure: true,
            ingredient: { select: { id: true, name: true, img: true } },
        },
    },
} satisfies Prisma.RecipeInclude;

type RecipeWithDetails = Prisma.RecipeGetPayload<{
    include: typeof recipeInclude;
}>;

export const findReferenceErrors = async (
    input: CreateRecipeInput,
): Promise<ReferenceIssue[]> => {
    const [category, area, ingredients] = await Promise.all([
        prisma.category.findUnique({
            where: { id: input.categoryId },
            select: { id: true },
        }),
        prisma.area.findUnique({
            where: { id: input.areaId },
            select: { id: true },
        }),
        prisma.ingredient.findMany({
            where: { id: { in: input.ingredients.map((item) => item.id) } },
            select: { id: true },
        }),
    ]);

    const errors: ReferenceIssue[] = [];

    if (!category) {
        errors.push({ path: "categoryId", message: "Unknown category" });
    }
    if (!area) {
        errors.push({ path: "areaId", message: "Unknown area" });
    }

    const knownIngredientIds = new Set(
        ingredients.map((ingredient) => ingredient.id),
    );
    input.ingredients.forEach((item, index) => {
        if (!knownIngredientIds.has(item.id)) {
            errors.push({
                path: `ingredients[${index}].id`,
                message: "Unknown ingredient",
            });
        }
    });

    return errors;
};

export const createRecipe = async (
    ownerId: string,
    input: CreateRecipeInput,
    imagePath: string,
) => {
    const recipeId = randomUUID();
    const thumb = await uploadImage(imagePath, recipeImagePublicId(recipeId));

    try {
        const recipe = await prisma.recipe.create({
            data: {
                id: recipeId,
                title: input.title,
                description: input.description,
                instructions: input.instructions,
                time: input.time,
                thumb,
                ownerId,
                categoryId: input.categoryId,
                areaId: input.areaId,
                ingredients: {
                    create: input.ingredients.map(({ id, measure }) => ({
                        ingredientId: id,
                        measure,
                    })),
                },
            },
            include: recipeInclude,
        });

        return toRecipeResponse(recipe);
    } catch (error) {
        await destroyImage(recipeImagePublicId(recipeId));
        throw error;
    }
};

const toRecipeResponse = (recipe: RecipeWithDetails) => ({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    instructions: recipe.instructions,
    time: recipe.time,
    thumb: recipe.thumb,
    ownerId: recipe.ownerId,
    category: recipe.category,
    area: recipe.area,
    ingredients: recipe.ingredients.map(({ measure, ingredient }) => ({
        id: ingredient.id,
        name: ingredient.name,
        img: ingredient.img,
        measure,
    })),
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
});

export const findRecipeOwnerId = async (
    recipeId: string,
): Promise<string | null> => {
    const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { ownerId: true },
    });

    return recipe?.ownerId ?? null;
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
    await prisma.recipe.delete({ where: { id: recipeId } });
    await destroyImage(recipeImagePublicId(recipeId));
};

const cardSelect = {
  id: true,
  title: true,
  description: true,
  thumb: true,
  time: true,
  owner: { select: { id: true, name: true, avatar: true } },
} satisfies Prisma.RecipeSelect;

type CardRecord = Prisma.RecipeGetPayload<{ select: typeof cardSelect }>;

// PostgreSQL uses ILIKE for case-insensitive equality; escape pattern characters.
const exactName = (value: string) => value.replace(/[\\%_]/g, "\\$&");

async function addFavorites(
  items: CardRecord[],
  userId?: string,
): Promise<RecipeCard[]> {
  const favorites =
    userId && items.length
      ? await prisma.favorite.findMany({
          where: { userId, recipeId: { in: items.map(({ id }) => id) } },
          select: { recipeId: true },
        })
      : [];
  const favoriteIds = new Set(favorites.map(({ recipeId }) => recipeId));
  return items.map((item) => ({
    ...item,
    isFavorite: favoriteIds.has(item.id),
  }));
}

export async function listRecipes(query: RecipesQuery, userId?: string) {
  const { page, limit, skip } = getPaginationParams(query);
  const where: Prisma.RecipeWhereInput = {};

  if (
    query.category &&
    !["all", "всі"].includes(query.category.toLowerCase())
  ) {
    where.category = {
      is: {
        OR: [
          { id: query.category },
          { name: { equals: exactName(query.category), mode: "insensitive" } },
        ],
      },
    };
  }
  if (query.area) {
    where.area = {
      is: {
        OR: [
          { id: query.area },
          { name: { equals: exactName(query.area), mode: "insensitive" } },
        ],
      },
    };
  }
  if (query.ingredient) {
    where.ingredients = { some: { ingredientId: query.ingredient } };
  }

  const { records, total } = await prisma.$transaction(
    async (tx) => {
      const total = await tx.recipe.count({ where });
      const records =
        skip >= total
          ? []
          : await tx.recipe.findMany({
              where,
              select: cardSelect,
              orderBy: [{ createdAt: "desc" }, { id: "asc" }],
              skip,
              take: limit,
            });
      return { records, total };
    },
    { isolationLevel: "RepeatableRead" },
  );

  const items = await addFavorites(records, userId);
  return formatPaginatedResponse(items, total, page, limit);
}

export async function listPopularRecipes(limit: number, userId?: string) {
  const records = await prisma.recipe.findMany({
    select: cardSelect,
    orderBy: [{ favorites: { _count: "desc" } }, { id: "asc" }],
    take: limit,
  });
  return addFavorites(records, userId);
}
