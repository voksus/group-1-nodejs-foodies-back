import { Router } from "express";
import "../docs/areas.ts";
import { getAreas } from "../controllers/areasController.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

const areasRouter = Router();

areasRouter.get("/", ctrlWrapper(getAreas));

export default areasRouter;