import { unlink } from "node:fs/promises";
import type { NextFunction, Request, Response } from "express";

export const removeTempUpload = (req: Request, res: Response, next: NextFunction): void => {
  const filePath = req.file?.path;

  if (filePath) {
    let removed = false;

    const remove = () => {
      if (removed) {
        return;
      }
      removed = true;

      void unlink(filePath).catch((error: unknown) => {
        console.warn("Failed to remove temporary upload:", error);
      });
    };

    res.once("finish", remove);
    res.once("close", remove);
  }

  next();
};
