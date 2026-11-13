import { Router } from "express";
import * as recipeController from "../controllers/recipeController.ts";
import { authStub } from "../middlewares/authStub.ts";
import { imageUpload } from "../middlewares/imageUpload.ts";
import { removeTempUpload } from "../middlewares/removeTempUpload.ts";
import { requireMultipart } from "../middlewares/requireMultipart.ts";
import { requireRecipeOwner } from "../middlewares/requireRecipeOwner.ts";
import { validateImageContent } from "../middlewares/validateImageContent.ts";
import { validateRecipeReferences } from "../middlewares/validateRecipeReferences.ts";
import { validateRequest } from "../middlewares/validateRequest.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";
import {
  CreateRecipeSchema,
  RecipeIdParamsSchema,
} from "../validators/recipeValidator.ts";

const recipeRouter = Router();

recipeRouter.post(
  "/",
  authStub,
  requireMultipart,
  imageUpload.single("thumb"),
  removeTempUpload,
  validateImageContent,
  validateRequest({ body: CreateRecipeSchema }),
  validateRecipeReferences,
  ctrlWrapper(recipeController.createRecipe),
);

recipeRouter.delete(
  "/:id",
  authStub,
  validateRequest({ params: RecipeIdParamsSchema }),
  requireRecipeOwner,
  ctrlWrapper(recipeController.deleteRecipe),
);

export default recipeRouter;
