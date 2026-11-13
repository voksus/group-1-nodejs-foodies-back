import type { Request, Response } from "express";
import { listTestimonials } from "../services/testimonialsService.ts";

export async function getTestimonials(_req: Request, res: Response) {
  const result = await listTestimonials();
  res.status(200).json(result);
}
