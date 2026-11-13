import { Router } from "express";
import "../docs/recipes.ts";
import * as recipesController from "../controllers/recipesController.ts";
import { authStub } from "../middlewares/authStub.ts";
import { imageUpload } from "../middlewares/imageUpload.ts";
import { removeTempUpload } from "../middlewares/removeTempUpload.ts";
import { requireMultipart } from "../middlewares/requireMultipart.ts";
import { requireRecipeOwner } from "../middlewares/requireRecipeOwner.ts";
import { validateImageContent } from "../middlewares/validateImageContent.ts";
import { validateRecipeReferences } from "../middlewares/validateRecipeReferences.ts";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.ts";
import { validateRequest } from "../middlewares/validateRequest.ts";
import {
  CreateRecipeSchema,
  PopularRecipesQuerySchema,
  RecipeIdParamsSchema,
  RecipesQuerySchema,
} from "../schemas/recipesSchemas.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

const recipesRouter = Router();

recipesRouter.post(
    "/",
    authStub,
    requireMultipart,
    imageUpload.single("thumb"),
    removeTempUpload,
    validateImageContent,
    validateRequest({ body: CreateRecipeSchema }),
    validateRecipeReferences,
    ctrlWrapper(recipesController.createRecipe),
);

recipesRouter.delete(
    "/:id",
    authStub,
    validateRequest({ params: RecipeIdParamsSchema }),
    requireRecipeOwner,
    ctrlWrapper(recipesController.deleteRecipe),
);

recipesRouter.get(
  "/popular",
  optionalAuthenticate,
  validateRequest({ query: PopularRecipesQuerySchema }),
  ctrlWrapper(recipesController.getPopularRecipes),
);

recipesRouter.get(
  "/",
  optionalAuthenticate,
  validateRequest({ query: RecipesQuerySchema }),
  ctrlWrapper(recipesController.getRecipes),
);

export default recipesRouter;
