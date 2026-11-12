import type { Request, Response } from "express";
import { createHttpError } from "../errors/HttpError.ts";
import * as recipeService from "../services/recipeService.ts";
import type { CreateRecipeInput } from "../validators/recipeValidator.ts";

export const createRecipe = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw createHttpError(400, "Recipe image is required");
  }

  const recipe = await recipeService.createRecipe(
    req.auth.userId,
    req.body as CreateRecipeInput,
    req.file.path,
  );

  res.status(201).json(recipe);
};

export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  await recipeService.deleteRecipe(req.params.id);

  res.status(204).end();
};
