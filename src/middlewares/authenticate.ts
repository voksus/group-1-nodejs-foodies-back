// src/middlewares/authenticate.ts
import { Request, Response, NextFunction } from 'express';

// Переконайся, що тут є слово export:
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // твоя логіка перевірки JWT
};