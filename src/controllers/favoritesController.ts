import type { Request, Response } from "express";
import { createHttpError } from "../errors/HttpError.ts";
import type {
  FavoriteRecipeParams,
  FavoritesQuery,
} from "../schemas/favoritesSchemas.ts";
import {
  addFavoriteRecipe,
  listFavoriteRecipes,
  removeFavoriteRecipe,
} from "../services/recipesService.ts";

const getCurrentUserId = (req: Request): string => {
  if (!req.user) throw createHttpError(401);
  return req.user.id;
};

export async function getFavorites(req: Request, res: Response) {
  const userId = getCurrentUserId(req);
  const query = req.query as unknown as FavoritesQuery;
  res.status(200).json(await listFavoriteRecipes(query, userId));
}

export async function addFavorite(req: Request, res: Response) {
  const userId = getCurrentUserId(req);
  const { id } = req.params as FavoriteRecipeParams;
  await addFavoriteRecipe(id, userId);
  res.status(200).json({ message: "Recipe added to favorites" });
}

export async function removeFavorite(req: Request, res: Response) {
  const userId = getCurrentUserId(req);
  const { id } = req.params as FavoriteRecipeParams;
  await removeFavoriteRecipe(id, userId);
  res.status(200).json({ message: "Recipe removed from favorites" });
}
