import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Set DIRECT_URL or DATABASE_URL in .env');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');

function readCsv<T extends Record<string, string>>(filename: string): T[] {
  return parse(readFileSync(path.join(dataDir, filename), 'utf8'), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
  }) as T[];
}

function optional(value: string): string | null {
  return value.trim() === '' ? null : value;
}

function requiredId(idsByName: Map<string, string>, name: string, kind: string): string {
  const id = idsByName.get(name);
  if (!id) throw new Error(`Unknown ${kind} in recipes CSV: ${JSON.stringify(name)}`);
  return id;
}

async function insertBatches<T>(
  label: string,
  rows: T[],
  createMany: (rows: T[]) => Promise<{ count: number }>,
): Promise<void> {
  let added = 0;
  for (let start = 0; start < rows.length; start += 250) {
    added += (await createMany(rows.slice(start, start + 250))).count;
  }
  console.log(`${label}: ${rows.length} source rows, ${added} inserted`);
}

async function main(): Promise<void> {
  const areas = readCsv<{ id: string; name: string }>('1_areas.csv');
  const categories = readCsv<{ id: string; name: string }>('2_categories.csv');
  const ingredients = readCsv<{
    id: string; name: string; description: string; img: string;
  }>('3_ingredients.csv');
  const users = readCsv<{
    id: string; name: string; email: string; avatar: string;
  }>('4_users.csv');
  const testimonials = readCsv<{
    id: string; owner_id: string; testimonial: string;
  }>('5_testimonials.csv');
  const recipes = readCsv<{
    id: string; title: string; category: string; area: string;
    instructions: string; description: string; thumb: string;
    preview: string; time: string; owner_id: string;
  }>('6_recipes.csv');
  const recipeIngredients = readCsv<{
    recipe_id: string; ingredient_id: string; measure: string;
  }>('7_recipe_ingredients.csv');

  const areaIds = new Map(areas.map(({ name, id }) => [name, id]));
  const categoryIds = new Map(categories.map(({ name, id }) => [name, id]));

  // Resolve category and area names to IDs before inserting recipes.
  const recipeRows = recipes.map((row) => {
    const time = optional(row.time);
    const minutes = time === null ? null : Number(time);
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 0)) {
      throw new Error(`Invalid time in recipe ${row.id}: ${row.time}`);
    }
    if (!row.instructions.trim()) {
      throw new Error(`Missing instructions in recipe ${row.id}`);
    }
    return {
      id: row.id,
      title: row.title,
      categoryId: requiredId(categoryIds, row.category, 'category'),
      areaId: requiredId(areaIds, row.area, 'area'),
      instructions: row.instructions,
      description: optional(row.description),
      thumb: optional(row.thumb),
      preview: optional(row.preview),
      time: minutes,
      ownerId: row.owner_id,
    };
  });

  await insertBatches('areas', areas, (data) =>
    prisma.area.createMany({ data, skipDuplicates: true }));
  await insertBatches('categories', categories, (data) =>
    prisma.category.createMany({ data, skipDuplicates: true }));
  await insertBatches('ingredients', ingredients.map((row) => ({
    id: row.id, name: row.name,
    description: optional(row.description), img: optional(row.img),
  })), (data) => prisma.ingredient.createMany({ data, skipDuplicates: true }));
  await insertBatches('users', users.map((row) => ({
    id: row.id, name: row.name, email: row.email.toLowerCase(),
    avatar: optional(row.avatar), password: null,
  })), (data) => prisma.user.createMany({ data, skipDuplicates: true }));
  await insertBatches('testimonials', testimonials.map((row) => ({
    id: row.id, ownerId: row.owner_id, testimonial: row.testimonial,
  })), (data) => prisma.testimonial.createMany({ data, skipDuplicates: true }));
  await insertBatches('recipes', recipeRows, (data) =>
    prisma.recipe.createMany({ data, skipDuplicates: true }));
  await insertBatches('recipe_ingredients', recipeIngredients.map((row) => ({
    recipeId: row.recipe_id, ingredientId: row.ingredient_id,
    measure: optional(row.measure),
  })), (data) => prisma.recipeIngredient.createMany({ data, skipDuplicates: true }));

  for (const [label, count] of [
    ['areas', await prisma.area.count()],
    ['categories', await prisma.category.count()],
    ['ingredients', await prisma.ingredient.count()],
    ['users', await prisma.user.count()],
    ['testimonials', await prisma.testimonial.count()],
    ['recipes', await prisma.recipe.count()],
    ['recipe_ingredients', await prisma.recipeIngredient.count()],
  ] as const) console.log(`Total ${label}: ${count}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
