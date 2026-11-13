import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../db.ts";
import type { RecipeCard, RecipesQuery } from "../schemas/recipesSchemas.ts";
import {
  formatPaginatedResponse,
  getPaginationParams,
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
