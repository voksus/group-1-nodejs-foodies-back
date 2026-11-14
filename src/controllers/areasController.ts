import type { Request, Response } from "express";
import { listAreas } from "../services/areasService.ts";

export async function getAreas(_req: Request, res: Response) {
  const result = await listAreas();
  res.status(200).json(result);
}