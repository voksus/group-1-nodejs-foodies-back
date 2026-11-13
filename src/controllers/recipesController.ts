import type { Request, Response } from "express";
import { createHttpError } from "../errors/HttpError.ts";
import type {
  CreateRecipeInput,
  PopularRecipesQuery,
  RecipesQuery,
} from "../schemas/recipesSchemas.ts";
import * as recipesService from "../services/recipesService.ts";

export const createRecipe = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw createHttpError(401, "Authentication required");
  }
  if (!req.file) {
    throw createHttpError(400, "Recipe image is required");
  }

  const recipe = await recipesService.createRecipe(
    req.user.id,
    req.body as CreateRecipeInput,
    req.file.path,
  );

  res.status(201).json(recipe);
};

export const deleteRecipe = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await recipesService.deleteRecipe(req.params.id);

  res.status(204).end();
};

export async function getRecipes(req: Request, res: Response) {
  const query = req.query as unknown as RecipesQuery;
  const result = await recipesService.listRecipes(query, req.user?.id);
  res.status(200).json(result);
}

export async function getPopularRecipes(req: Request, res: Response) {
  const { limit } = req.query as unknown as PopularRecipesQuery;
  const result = await recipesService.listPopularRecipes(limit, req.user?.id);
  res.status(200).json(result);
}
