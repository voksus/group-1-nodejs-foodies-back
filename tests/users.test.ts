import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import type { Server } from "node:http";
import { after, before, test } from "node:test";
import { parse } from "dotenv";
import pg from "pg";
import type { PrismaClient } from "../generated/prisma/client.ts";

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
  "User tests require local PostgreSQL",
);

const databaseName = `foodies_users_test_${randomBytes(6).toString("hex")}`;
const databaseUrl = new URL(adminUrl);
databaseUrl.pathname = `/${databaseName}`;

const admin = new pg.Client({
  connectionString: adminUrl,
  connectionTimeoutMillis: 10000,
});

const ids = {
  alice: randomUUID(),
  bob: randomUUID(),
  charlie: randomUUID(),
  category: randomUUID(),
  area: randomUUID(),
};

const recipeId = (index: number) =>
  "b".repeat(20) + String(index).padStart(4, "0");

let prisma: PrismaClient;
let server: Server;
let baseUrl: string;
let created = false;
let userService: typeof import("../src/services/usersService.ts");

async function get(path: string, headers?: HeadersInit) {
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

  process.env.DATABASE_URL = databaseUrl.toString();
  process.env.DIRECT_URL = databaseUrl.toString();
  process.env.JWT_SECRET = randomBytes(48).toString("hex");
  process.env.NODE_ENV = "test";

  execFileSync(
    process.execPath,
    ["./node_modules/prisma/build/index.js", "db", "push"],
    {
      env: process.env,
      stdio: "ignore",
    },
  );

  prisma = (await import("../src/db.ts")).prisma;
  userService = await import("../src/services/usersService.ts");
  const app = (await import("../src/app.ts")).default;

  await prisma.user.createMany({
    data: [
      {
        id: ids.alice,
        name: "Alice",
        email: "alice@example.test",
        password: "test-only",
        avatar: "https://example.test/alice.jpg",
      },
      {
        id: ids.bob,
        name: "Bob",
        email: "bob@example.test",
        password: "test-only",
      },
      {
        id: ids.charlie,
        name: "Charlie",
        email: "charlie@example.test",
        password: "test-only",
      },
    ],
  });

  await prisma.category.create({
    data: { id: ids.category, name: "Dessert" },
  });
  await prisma.area.create({
    data: { id: ids.area, name: "Ukrainian" },
  });

  await prisma.recipe.createMany({
    data: Array.from({ length: 5 }, (_, i) => ({
      id: recipeId(i),
      title: `Bob Recipe ${i}`,
      ownerId: ids.bob,
      categoryId: ids.category,
      areaId: ids.area,
      instructions: "Mix and bake.",
      thumb: `https://example.test/recipe-${i}.jpg`,
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)),
    })),
  });

  await prisma.favorite.create({
    data: { userId: ids.alice, recipeId: recipeId(0) },
  });

  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", () => resolve());
    server.once("error", reject);
  });
  const address = server.address();
  assert(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  if (prisma) await prisma.$disconnect();
  if (created) await admin.query(`DROP DATABASE "${databaseName}"`);
  await admin.end();
});

test("unauthenticated requests to /api/users/* return 401", async () => {
  for (const path of [
    "/api/users/current",
    "/api/users/following",
    `/api/users/${ids.bob}`,
    `/api/users/${ids.bob}/followers`,
  ]) {
    const { status } = await get(path);
    assert.equal(status, 401, path);
  }
});

test("follow and unfollow flow updates counts, lists and prevents self-follow", async () => {
  await assert.rejects(
    () => userService.followUserService(ids.alice, ids.alice),
    { status: 400, message: "You cannot follow yourself" },
  );

  await assert.rejects(
    () => userService.followUserService(ids.alice, randomUUID()),
    { status: 404, message: "User not found" },
  );

  const followRes = await userService.followUserService(ids.alice, ids.bob);
  assert.deepEqual(followRes, { message: "Successfully followed" });

  // Repeat follow is idempotent
  await userService.followUserService(ids.alice, ids.bob);
  await userService.followUserService(ids.charlie, ids.bob);

  const aliceProfile = await userService.getCurrentUserService(ids.alice);
  assert.deepEqual(aliceProfile, {
    id: ids.alice,
    name: "Alice",
    email: "alice@example.test",
    avatar: "https://example.test/alice.jpg",
    recipesCount: 0,
    favoritesCount: 1,
    followersCount: 0,
    followingCount: 1,
  });

  const bobPublicProfile = await userService.getUserByIdService(
    ids.bob,
    ids.alice,
  );
  assert.deepEqual(bobPublicProfile, {
    id: ids.bob,
    name: "Bob",
    email: "bob@example.test",
    avatar: null,
    recipesCount: 5,
    followersCount: 2,
    isFollowing: true,
  });

  const followingList = await userService.getFollowingService(ids.alice, 1, 5);
  assert.equal(followingList.total, 1);
  assert.equal(followingList.totalPages, 1);
  assert.equal(followingList.items.length, 1);
  assert.equal(followingList.items[0].id, ids.bob);
  assert.equal(followingList.items[0].recipesCount, 5);
  assert.equal(followingList.items[0].recipes.length, 4);
  assert.equal(followingList.items[0].recipes[0].id, recipeId(4));

  const followersList = await userService.getFollowersService(
    ids.bob,
    ids.alice,
    1,
    5,
  );
  assert.equal(followersList.total, 2);
  const charlieCard = followersList.items.find((u) => u.id === ids.charlie);
  assert(charlieCard);
  assert.equal(charlieCard.isFollowing, false);

  const unfollowRes = await userService.unfollowUserService(ids.alice, ids.bob);
  assert.deepEqual(unfollowRes, { message: "Successfully unfollowed" });

  const bobAfterUnfollow = await userService.getUserByIdService(
    ids.bob,
    ids.alice,
  );
  assert.equal(bobAfterUnfollow.followersCount, 1);
  assert.equal(bobAfterUnfollow.isFollowing, false);
});

test("Swagger registers all user endpoints and schemas", async () => {
  const { generateOpenApiDocument } = await import("../src/openapi.ts");
  const doc = generateOpenApiDocument();

  assert(doc.paths["/api/users/current"]?.get);
  assert(doc.paths["/api/users/following"]?.get);
  assert(doc.paths["/api/users/avatars"]?.patch);
  assert(doc.paths["/api/users/{id}"]?.get);
  assert(doc.paths["/api/users/{id}/followers"]?.get);
  assert(doc.paths["/api/users/{id}/follow"]?.post);
  assert(doc.paths["/api/users/{id}/follow"]?.delete);

  assert(doc.components?.schemas?.CurrentUserResponse);
  assert(doc.components?.schemas?.UserByIdResponse);
  assert(doc.components?.schemas?.PaginatedUserCards);
  assert(doc.components?.schemas?.AvatarResponse);
});
