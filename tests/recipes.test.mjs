import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { parse } from "dotenv";
import jwt from "jsonwebtoken";
import pg from "pg";

const envPath = new URL("../.env", import.meta.url);
const localEnv = existsSync(envPath)
  ? parse(readFileSync(envPath, "utf8"))
  : {};
const adminUrl = process.env.TEST_DATABASE_URL ?? localEnv.DATABASE_URL;
assert(
  adminUrl,
  "Set TEST_DATABASE_URL or configure a local DATABASE_URL in .env",
);
const parsedUrl = new URL(adminUrl);
assert(
  ["localhost", "127.0.0.1"].includes(parsedUrl.hostname),
  "Recipe tests require local PostgreSQL",
);
const databaseName = `foodies_recipes_test_${randomBytes(6).toString("hex")}`;
const databaseUrl = new URL(adminUrl);
databaseUrl.pathname = `/${databaseName}`;
const admin = new pg.Client({
  connectionString: adminUrl,
  connectionTimeoutMillis: 10000,
});
const secret = randomBytes(48).toString("hex");
const ids = {
  owner: randomUUID(),
  alice: "b".repeat(24),
  bob: randomUUID(),
  seafood: "c".repeat(24),
  dessert: randomUUID(),
  italian: randomUUID(),
  ukrainian: "d".repeat(24),
  tomato: "e".repeat(24),
  cocoa: randomUUID(),
};
const recipeId = (index) => "a".repeat(20) + String(index).padStart(4, "0");
let prisma;
let server;
let baseUrl;
let created = false;

const token = (userId, options = {}) =>
  jwt.sign({ sub: userId, type: "access" }, secret, {
    algorithm: "HS256",
    expiresIn: "15m",
    ...options,
  });
const bearer = (userId) => ({ Authorization: `Bearer ${token(userId)}` });
async function get(path, headers) {
  const response = await fetch(baseUrl + path, {
    headers,
    signal: AbortSignal.timeout(10000),
  });
  return { status: response.status, body: await response.json() };
}

before(async () => {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  created = true;
  const setup = new pg.Client({ connectionString: databaseUrl.toString() });
  await setup.connect();
  try {
    const migrationsDir = new URL("../prisma/migrations/", import.meta.url);
    const directories = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    for (const directory of directories) {
      await setup.query(
        readFileSync(
          new URL(`${directory}/migration.sql`, migrationsDir),
          "utf8",
        ),
      );
    }
  } finally {
    await setup.end();
  }

  process.env.DATABASE_URL = databaseUrl.toString();
  process.env.DIRECT_URL = databaseUrl.toString();
  process.env.JWT_SECRET = secret;
  process.env.NODE_ENV = "test";
  prisma = (await import("../src/db.ts")).prisma;
  const app = (await import("../src/app.ts")).default;

  await prisma.user.createMany({
    data: [
      {
        id: ids.owner,
        name: "Recipe author",
        email: "owner@example.test",
        password: "test-only",
      },
      {
        id: ids.alice,
        name: "Alice",
        email: "alice@example.test",
        password: "test-only",
      },
      {
        id: ids.bob,
        name: "Bob",
        email: "bob@example.test",
        password: "test-only",
      },
    ],
  });
  await prisma.category.createMany({
    data: [
      { id: ids.seafood, name: "Seafood" },
      { id: ids.dessert, name: "Dessert" },
    ],
  });
  await prisma.area.createMany({
    data: [
      { id: ids.italian, name: "Italian" },
      { id: ids.ukrainian, name: "Ukrainian" },
    ],
  });
  await prisma.ingredient.createMany({
    data: [
      { id: ids.tomato, name: "Tomato" },
      { id: ids.cocoa, name: "Cocoa" },
    ],
  });
  await prisma.recipe.createMany({
    data: Array.from({ length: 16 }, (_, i) => ({
      id: recipeId(i),
      title: `Recipe ${i}`,
      ownerId: ids.owner,
      categoryId: i % 2 === 0 ? ids.seafood : ids.dessert,
      areaId: i % 3 === 0 ? ids.italian : ids.ukrainian,
      instructions: "Prepare the ingredients.",
      description: i === 0 ? null : `Description ${i}`,
      thumb: i === 0 ? null : "https://example.test/recipe.jpg",
      time: i === 0 ? null : i + 10,
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)),
    })),
  });
  await prisma.recipeIngredient.createMany({
    data: [
      ...Array.from({ length: 16 }, (_, i) => ({
        recipeId: recipeId(i),
        ingredientId: i % 2 === 0 ? ids.tomato : ids.cocoa,
        measure: "1",
      })),
      { recipeId: recipeId(1), ingredientId: ids.tomato, measure: "2" },
    ],
  });
  await prisma.favorite.createMany({
    data: [
      ...[0, 2, 3].map((i) => ({ userId: ids.alice, recipeId: recipeId(i) })),
      ...[0, 3].map((i) => ({ userId: ids.bob, recipeId: recipeId(i) })),
      { userId: ids.owner, recipeId: recipeId(0) },
    ],
  });
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  if (prisma) await prisma.$disconnect();
  if (created) await admin.query(`DROP DATABASE "${databaseName}"`);
  await admin.end();
});

test("guest defaults and exact RecipeCard fields", async () => {
  const { status, body } = await get("/api/recipes");
  assert.equal(status, 200);
  assert.equal(body.total, 16);
  assert.equal(body.page, 1);
  assert.equal(body.limit, 12);
  assert.equal(body.totalPages, 2);
  assert.equal(body.items.length, 12);
  assert.equal(body.items[0].id, recipeId(15));
  for (const card of body.items) {
    assert.deepEqual(Object.keys(card).sort(), [
      "description",
      "id",
      "isFavorite",
      "owner",
      "thumb",
      "time",
      "title",
    ]);
    assert.deepEqual(card.owner, {
      id: ids.owner,
      name: "Recipe author",
      avatar: null,
    });
    assert.equal(card.isFavorite, false);
  }
});

test("pages are deterministic, disjoint and complete", async () => {
  const seen = [];
  for (let page = 1; page <= 4; page++) {
    const { status, body } = await get(`/api/recipes?page=${page}&limit=5`);
    assert.equal(status, 200);
    assert.equal(body.page, page);
    assert.equal(body.totalPages, 4);
    seen.push(...body.items.map((card) => card.id));
  }
  assert.deepEqual(
    seen,
    Array.from({ length: 16 }, (_, i) => recipeId(15 - i)),
  );
});

test("category accepts original IDs, UUIDs and case-insensitive names", async () => {
  for (const [value, expected] of [
    [ids.seafood, 8],
    [" sEaFoOd ", 8],
    [ids.dessert, 8],
  ]) {
    const { status, body } = await get(
      `/api/recipes?${new URLSearchParams({ category: value })}`,
    );
    assert.equal(status, 200);
    assert.equal(body.total, expected);
  }
});

test("all-category aliases preserve area and ingredient filters", async () => {
  for (const category of ["all", "ALL", "всі", " ВСІ "]) {
    const { body } = await get(
      "/api/recipes?" +
        new URLSearchParams({
          category,
          area: "Italian",
          ingredient: ids.tomato,
        }),
    );
    assert.equal(body.total, 3);
    assert.deepEqual(
      body.items.map((card) => card.id),
      [recipeId(12), recipeId(6), recipeId(0)],
    );
  }
});

test("area accepts UUIDs, original IDs and case-insensitive names", async () => {
  for (const [value, expected] of [
    [ids.italian, 6],
    ["italian", 6],
    [ids.ukrainian, 10],
  ]) {
    const { status, body } = await get(
      `/api/recipes?${new URLSearchParams({ area: value })}`,
    );
    assert.equal(status, 200);
    assert.equal(body.total, expected);
  }
});

test("ingredient filtering uses the join table without duplicate cards", async () => {
  for (const [ingredient, expected] of [
    [ids.tomato, 9],
    [ids.cocoa, 8],
  ]) {
    const { status, body } = await get(
      `/api/recipes?${new URLSearchParams({ ingredient })}`,
    );
    assert.equal(status, 200);
    assert.equal(body.total, expected);
    assert.equal(new Set(body.items.map((card) => card.id)).size, expected);
  }
});

test("all three filters are combined with AND", async () => {
  const { body } = await get(
    "/api/recipes?" +
      new URLSearchParams({
        category: ids.seafood,
        area: "Italian",
        ingredient: ids.tomato,
      }),
  );
  assert.equal(body.total, 3);
  assert.deepEqual(
    body.items.map((card) => card.id),
    [recipeId(12), recipeId(6), recipeId(0)],
  );
  assert.equal(body.items[2].time, null);
  assert.equal(body.items[2].description, null);
});

test("category and area names are exact, not SQL wildcard patterns", async () => {
  for (const query of [
    "category=%25",
    "category=Sea%25",
    "area=%25",
    "area=It_lian",
  ]) {
    const { status, body } = await get(`/api/recipes?${query}`);
    assert.equal(status, 200);
    assert.equal(body.total, 0, query);
  }
});

test("literal percent, underscore and backslash characters in a name can be searched", async () => {
  const name = "Sea_food%\\Special";
  await prisma.category.update({ where: { id: ids.seafood }, data: { name } });
  try {
    const { status, body } = await get(
      `/api/recipes?${new URLSearchParams({ category: name.toLowerCase() })}`,
    );
    assert.equal(status, 200);
    assert.equal(body.total, 8);
  } finally {
    await prisma.category.update({
      where: { id: ids.seafood },
      data: { name: "Seafood" },
    });
  }
});

test("unknown filters and out-of-range pages return empty items", async () => {
  for (const suffix of [
    "category=Unknown",
    "area=Unknown",
    `ingredient=${"f".repeat(24)}`,
  ]) {
    const { status, body } = await get(`/api/recipes?${suffix}`);
    assert.equal(status, 200);
    assert.deepEqual(body, {
      items: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 1,
    });
  }
  for (const page of [10, Number.MAX_SAFE_INTEGER]) {
    const { status, body } = await get(`/api/recipes?page=${page}`);
    assert.equal(status, 200);
    assert.equal(body.total, 16);
    assert.equal(body.items.length, 0);
  }
});

test("query validation rejects invalid pagination and filters", async () => {
  for (const query of [
    "page=0",
    "page=-1",
    "page=1.5",
    "page=no",
    "page[]=2",
    "limit[]=2",
    "page[x]=1",
    "limit=0",
    "limit=51",
    "limit=",
    "ingredient=wrong",
    "category=",
    "area=",
    "category=x&category=y",
  ]) {
    const { status, body } = await get(`/api/recipes?${query}`);
    assert.equal(status, 400, query);
    assert.equal(body.message, "Validation error");
    assert(Array.isArray(body.errors));
  }
  const { status } = await get("/api/recipes?limit=50");
  assert.equal(status, 200);
});

test("Bearer authentication returns only the current user's favorites", async () => {
  for (const [user, favorites] of [
    [ids.alice, [0, 2, 3]],
    [ids.bob, [0, 3]],
  ]) {
    const { status, body } = await get("/api/recipes?limit=50", bearer(user));
    assert.equal(status, 200);
    assert.deepEqual(
      body.items
        .filter((card) => card.isFavorite)
        .map((card) => card.id)
        .sort(),
      favorites.map(recipeId).sort(),
    );
  }
});

test("accessToken cookie authenticates the request", async () => {
  const { status, body } = await get("/api/recipes?limit=50", {
    Cookie: `accessToken=${token(ids.alice)}`,
  });
  assert.equal(status, 200);
  assert.equal(body.items.filter((card) => card.isFavorite).length, 3);
});

test("invalid, expired, unsupported and deleted-user tokens return 401", async () => {
  for (const accessToken of [
    "invalid",
    token(ids.alice, { expiresIn: -1 }),
    token(ids.alice, { algorithm: "HS384" }),
    token(randomUUID()),
    jwt.sign({ sub: ids.alice, type: "access" }, secret),
    jwt.sign({ sub: ids.alice, type: "refresh" }, secret, { expiresIn: "7d" }),
    jwt.sign({ sub: ids.alice }, secret, { expiresIn: "15m" }),
    jwt.sign({ sub: 42, type: "access" }, secret, { expiresIn: "15m" }),
    jwt.sign({ sub: ids.alice, type: "access" }, "wrong-signing-secret", {
      expiresIn: "15m",
    }),
  ]) {
    const { status } = await get("/api/recipes", {
      Authorization: `Bearer ${accessToken}`,
    });
    assert.equal(status, 401);
  }
  assert.equal(
    (await get("/api/recipes", { Authorization: "Basic abc" })).status,
    401,
  );
});

test("an invalid Bearer token is not hidden by a valid cookie", async () => {
  const { status } = await get("/api/recipes", {
    Authorization: "Bearer invalid",
    Cookie: `accessToken=${token(ids.alice)}`,
  });
  assert.equal(status, 401);
});

test("popular recipes use global favorite counts, a default of four and stable ties", async () => {
  const { status, body } = await get("/api/recipes/popular");
  assert.equal(status, 200);
  assert(Array.isArray(body));
  assert.deepEqual(
    body.map((card) => card.id),
    [recipeId(0), recipeId(3), recipeId(2), recipeId(1)],
  );
  assert(body.every((card) => card.isFavorite === false));
  const { body: personalized } = await get(
    "/api/recipes/popular",
    bearer(ids.bob),
  );
  assert.deepEqual(
    personalized.map((card) => card.isFavorite),
    [true, true, false, false],
  );
  const { body: custom } = await get("/api/recipes/popular?limit=2");
  assert.equal(custom.length, 2);
});

test("popular query limits are validated", async () => {
  for (const limit of ["0", "-1", "1.2", "51", "no"]) {
    assert.equal(
      (await get(`/api/recipes/popular?limit=${limit}`)).status,
      400,
    );
  }
  assert.equal((await get("/api/recipes/popular?limit[]=2")).status, 400);
});

test("Swagger includes query defaults, bounds, nullable cards and optional authentication", async () => {
  const { generateOpenApiDocument } = await import("../src/openapi.ts");
  const doc = generateOpenApiDocument();
  const search = doc.paths["/api/recipes"].get;
  const popular = doc.paths["/api/recipes/popular"].get;
  assert.deepEqual(search.parameters.map((param) => param.name).sort(), [
    "area",
    "category",
    "ingredient",
    "limit",
    "page",
  ]);
  const limit = search.parameters.find((param) => param.name === "limit");
  assert.equal(limit.schema.default, 12);
  assert.equal(limit.schema.maximum, 50);
  assert.equal(
    search.parameters.find((param) => param.name === "page").schema.default,
    1,
  );
  assert.equal(
    popular.parameters.find((param) => param.name === "limit").schema.default,
    4,
  );
  assert.deepEqual(search.security, [
    { bearerAuth: [] },
    { cookieAuth: [] },
    {},
  ]);
  assert.equal(
    doc.components.schemas.RecipeCard.properties.time.nullable,
    true,
  );
  assert.equal(
    popular.responses[200].content["application/json"].schema.type,
    "array",
  );
  assert.equal((await fetch(`${baseUrl}/api-docs/`)).status, 200);
});
