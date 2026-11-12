import type { Request, Response } from "express";
import type {
  PopularRecipesQuery,
  RecipesQuery,
} from "../schemas/recipesSchemas.ts";
import { listPopularRecipes, listRecipes } from "../services/recipesService.ts";

export async function getRecipes(req: Request, res: Response) {
  const query = req.query as unknown as RecipesQuery;
  const result = await listRecipes(query, req.user?.sub);
  res.status(200).json(result);
}

export async function getPopularRecipes(req: Request, res: Response) {
  const { limit } = req.query as unknown as PopularRecipesQuery;
  const result = await listPopularRecipes(limit, req.user?.sub);
  res.status(200).json(result);
}
