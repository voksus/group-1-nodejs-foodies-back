import { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../db.ts";
import { createHttpError } from "../errors/HttpError.ts";
import type { FavoritesQuery } from "../schemas/favoritesSchemas.ts";
import type { RecipeCard, RecipesQuery } from "../schemas/recipesSchemas.ts";
import {
  formatPaginatedResponse,
  getPaginationParams,
  type PaginationQuery,
} from "../utils/pagination.ts";

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

  const { records, total, page, limit } = await getRecipePage(where, query);
  const items = await addFavorites(records, userId);
  return formatPaginatedResponse(items, total, page, limit);
}

async function getRecipePage(
  where: Prisma.RecipeWhereInput,
  query: PaginationQuery,
  defaultLimit = 12,
) {
  const { page, limit, skip } = getPaginationParams(query, defaultLimit);
  const result = await prisma.$transaction(
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

  return { ...result, page, limit };
}

export async function listPopularRecipes(limit: number, userId?: string) {
  const records = await prisma.recipe.findMany({
    select: cardSelect,
    orderBy: [{ favorites: { _count: "desc" } }, { id: "asc" }],
    take: limit,
  });
  return addFavorites(records, userId);
}

export async function listFavoriteRecipes(
  query: FavoritesQuery,
  userId: string,
) {
  const { records, total, page, limit } = await getRecipePage(
    { favorites: { some: { userId } } },
    query,
    9,
  );
  const items = records.map((record) => ({ ...record, isFavorite: true }));
  return formatPaginatedResponse(items, total, page, limit);
}

async function assertRecipeExists(recipeId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true },
  });
  if (!recipe) throw createHttpError(404, "Recipe not found");
}

export async function addFavoriteRecipe(recipeId: string, userId: string) {
  await assertRecipeExists(recipeId);
  try {
    await prisma.favorite.createMany({
      data: [{ recipeId, userId }],
      skipDuplicates: true,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      await assertRecipeExists(recipeId);
    }
    throw error;
  }
}

export async function removeFavoriteRecipe(recipeId: string, userId: string) {
  await prisma.favorite.deleteMany({ where: { recipeId, userId } });
}
