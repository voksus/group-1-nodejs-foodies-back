import { z } from "../utils/zod.ts";

export const IdSchema = z.union([z.string().regex(/^[a-f\d]{24}$/i), z.uuid()]);

export const createPositiveIntegerQuerySchema = (
  defaultValue: number,
  max?: number,
) => {
  const numberSchema = z.coerce.number().int().min(1);
  return z
    .preprocess(
      (value) =>
        typeof value === "string" ||
        typeof value === "number" ||
        value === undefined
          ? value
          : Number.NaN,
      max === undefined ? numberSchema : numberSchema.max(max),
    )
    .default(defaultValue);
};
