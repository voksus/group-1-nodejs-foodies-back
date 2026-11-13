import { Router } from "express";
import "../docs/testimonials.ts";
import { getTestimonials } from "../controllers/testimonialsController.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

const testimonialsRouter = Router();

testimonialsRouter.get("/", ctrlWrapper(getTestimonials));

export default testimonialsRouter;
