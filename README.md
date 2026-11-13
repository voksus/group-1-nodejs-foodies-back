# Foodies — Database setup

Database setup for the Foodies educational full-stack project: **PostgreSQL 16 in Docker for local development**, **Neon for the shared dev environment**, and **Prisma 7** for the schema, migrations, and queries.

## Current status

- The database starts from one initial migration, `20261112010000_init`, containing the complete current schema. Local PostgreSQL and the shared Neon dev database use this migration history.
- Initial CSV seed completed successfully: **3,897 records** across seven tables.
- Both databases were recreated from this single initial migration before team development began. Their seeded IDs, field values, and relationships have been checked against all seven source CSV files.
- The schema includes session timestamps, multiple sessions per user, UUID generation support, required passwords, and optional category descriptions and thumbnails. Prisma maps ingredient `desc` to the `description` column and the `UserFollow` model to the `follows` table.
- The remaining three tables (`favorites`, `follows`, `refresh_tokens`) start empty and are populated by application actions.
- The database schema, migrations, seed, and documentation are included in the team backend repository. `src/db.ts` exports the shared Prisma Client configured with the PostgreSQL adapter and `DATABASE_URL`.

## Database design

The database contains **10 application tables**:

| Table                | Purpose                                       | Initial records |
| -------------------- | --------------------------------------------- | --------------: |
| `areas`              | Regions of origin                             |              27 |
| `categories`         | Recipe categories                             |              15 |
| `ingredients`        | Ingredient catalog                            |             574 |
| `users`              | User profiles and authentication fields       |               3 |
| `testimonials`       | User testimonials                             |               3 |
| `recipes`            | Recipes                                       |             285 |
| `recipe_ingredients` | Recipe–ingredient relationships and measures  |           2,990 |
| `favorites`          | User favorite recipes                         |               0 |
| `follows`            | User-to-user subscriptions                    |               0 |
| `refresh_tokens`     | Refresh tokens for user sessions, with expiry |               0 |

See the [ER diagram](docs/erd.svg) and [editable Mermaid diagram](docs/erd.md).

**Design choices:** original 24-character GoIT identifiers are preserved. ID columns and their foreign keys allow up to 36 characters; Prisma generates UUIDs for new records with a standalone string primary key when no ID is supplied. UUID defaults run in Prisma Client, so raw SQL inserts must still supply IDs. A recipe references a `Category` and an `Area` by ID; the seed resolves these IDs from the names in the original CSV files. Recipe ingredients, favorites, and follows use composite primary keys. Users can have multiple refresh tokens, each with required `expiresAt` and automatic `createdAt`; authentication must enforce expiration and token rotation in the backend.

`User.password` is required and must contain a password hash. The CSV has no passwords, so seed assigns bcrypt hashes of discarded random passwords. These profiles are **not login-ready accounts**. Repeated seed runs preserve existing password hashes. New refresh tokens must supply their actual expiry.

The supplied CSVs have no description for 4 ingredients and 2 recipes, no time for 1 recipe, and no measure for 24 recipe ingredients. These fields remain nullable to preserve the source data without inventing values. Category descriptions and thumbnails are optional and are not supplied by the categories CSV.

Seed keeps source IDs and text values, resolves recipe category/area names to their IDs, converts empty optional values to `null`, converts recipe time to an integer, and lowercases user emails. Generated timestamps and password hashes are not source CSV data: they are created anew when an empty database is seeded. Re-running seed in the same database preserves them.

## Requirements

- Node.js 24 (project was initialized with Node.js 24.21.0)
- npm
- Docker Compose for local PostgreSQL; Neon for the shared dev environment
- Prisma CLI and Client **7.10.1** (keep the versions aligned)

## Configuration

Create `.env` locally based on `.env.example` (never commit `.env`):

The `.env.example` file contains Neon placeholders. For local Docker development, replace `DATABASE_URL` in your local `.env` with:

```dotenv
DATABASE_URL="postgresql://foodies_user:foodies_password@localhost:5432/foodies_db"
```

Leave `DIRECT_URL` unset for local Docker; it is commented out in `.env.example`. Start PostgreSQL with `docker compose up -d postgres`. The shared Compose configuration uses port `5432` and persists data in the project volume. Stop it with `docker compose down`; this preserves the data. Local Docker PostgreSQL does not need Neon SSL parameters.

If port `5432` is occupied on your computer, use a local `docker-compose.override.yml` instead of changing the shared Compose file. With Docker Compose 2.24.4 or later, [`!override`](https://docs.docker.com/reference/compose-file/merge/#replace-value) can replace the published port:

```yaml
services:
  postgres:
    ports: !override
      - "127.0.0.1:55432:5432"
```

Set the same port in your local `DATABASE_URL`. Keep the override local by adding `/docker-compose.override.yml` to `.git/info/exclude`. Compose automatically loads it alongside `docker-compose.yml`.

For the shared Neon dev environment, set both connection strings there:

```dotenv
DATABASE_URL="postgresql://<user>:<password>@<pooled-host>/<database>?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<direct-host>/<database>?sslmode=require"
```

- `DATABASE_URL` is for regular backend Prisma Client queries; use the Neon **pooled** endpoint (host contains `-pooler`).
- `DIRECT_URL` is for Prisma CLI migrations and the CSV seed; use the Neon **direct** endpoint (without `-pooler`).
- The project uses `prisma.config.ts`, with `datasource.url` set to `process.env.DIRECT_URL ?? process.env.DATABASE_URL` and `migrations.seed` set to `"tsx prisma/seed.ts"`.
- The existing seed reads `DIRECT_URL` (or falls back to `DATABASE_URL`).

**Do not post connection strings in public channels or include them in Git commits.** Share credentials with the backend maintainers privately through your team's approved secure channel.

## Setup in the backend repository

The database files have already been transferred into this repository, and the required dependencies and npm scripts are present. Keep `prisma`, `@prisma/client`, and `@prisma/adapter-pg` at **7.10.1**.

Run the commands from the repository root with Docker Desktop (or Docker Engine with Compose) running. If `.env` does not exist, copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell or `cp .env.example .env` in Bash). For local development, set `DATABASE_URL` to the local Docker connection shown above and leave `DIRECT_URL` unset.

Install dependencies, start PostgreSQL, apply migrations, and import the CSV data:

```bash
npm ci
docker compose up -d postgres
docker compose exec postgres sh -c 'until pg_isready -U foodies_user -d foodies_db; do sleep 1; done'
npx prisma validate
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run typecheck
npx prisma migrate status
```

In PowerShell, if script execution is disabled, use `npm.cmd` and `npx.cmd` instead of `npm` and `npx`.

After setup, start the backend with `npm run dev`. With the example's `PORT=3000`, check `http://localhost:3000/api/health` and open Swagger at `http://localhost:3000/api-docs/`.

The backend's `.env.example` also includes JWT, CORS, and Cloudinary configuration. Preserve those settings when configuring the database. Generating Prisma Client and checking types do not run migrations or seed the database.

### Migrations

The repository starts from `20261112010000_init`. Check migration status with `npx prisma migrate status`. From this point onward, preserve applied migration files: develop and test schema changes in local PostgreSQL, commit new migrations, and review them through a PR before applying them to the shared Neon dev environment.

To apply committed migrations to a local database, set `DATABASE_URL` and leave `DIRECT_URL` unset, then run:

```bash
npm run prisma:deploy
```

Use the same command to apply future committed migrations to an existing database.

When changing the schema during development, first target local PostgreSQL (the local Docker `DATABASE_URL` shown above, with `DIRECT_URL` unset), edit `prisma/schema.prisma`, and create a new migration:

```bash
npm run prisma:migrate -- --name describe_change
npm run prisma:generate
npm run typecheck
```

Commit the schema and new migration together. Keep `20261112010000_init` and all subsequently applied migrations unchanged. The shared Neon environment receives reviewed migrations with `npm run prisma:deploy`; everyday schema development uses local PostgreSQL.

To clear disposable local test data and rebuild the local database, use the same local environment settings and run:

```bash
npx prisma migrate reset --force
npm run prisma:seed
```

Reset deletes all data in the configured database. It is not part of normal setup or the shared Neon deployment workflow.

### Seed import

The seed script loads the supplied CSVs in foreign-key-safe order using Prisma `createMany({ skipDuplicates: true })`. Re-running it skips existing keys, but **does not update** existing rows.

All batches are imported in one transaction. If any batch fails, the entire import is rolled back. Existing rows, including user password hashes, are preserved. Initial totals are listed in the table above.

For a new database, after applying migrations, import the initial data with:

```bash
npm run prisma:seed
```

The existing Neon database is already seeded and does not need another import.

> Running seed modifies the database specified by the environment variables. Double-check the target before running it.

## Working with Prisma

```bash
npx prisma validate
npx prisma generate
npx prisma studio
npx prisma migrate status
```

The generated Prisma Client is output to `generated/prisma/` by the configured `prisma-client` generator. It should be regenerated after schema changes; do not rely on committing generated client code.

## Recipe endpoints

`GET /api/recipes` accepts `category` (ID or exact name; `all` / `всі` means all categories), `ingredient` (ID), `area` (ID or exact name), `page` (default 1), and `limit` (default 12, maximum 100). Filters are combined with AND. Responses use `{ items, total, page, limit, totalPages }`; an empty result has `totalPages: 1`, matching the shared pagination helper.

`GET /api/recipes/popular` returns an array of cards ordered by favorite count descending; `limit` defaults to 4 and is capped at 50. Each card includes `id`, `title`, `description`, `thumb`, `time`, `owner: { id, name, avatar }`, and `isFavorite`. Full parameter and response schemas are available in Swagger at `/api-docs/`.

Both endpoints allow guests. Optional authentication uses an HS256 access token in `Authorization: Bearer <token>` or the `accessToken` cookie, with a string user ID in `sub` or `id` and a required expiry (`exp`). If both ID fields are present, `sub` takes precedence. The optional `type` claim must equal `"access"` when present. The authenticated user is available as `req.user.id` and `req.user.sub`. A supplied Authorization header takes precedence over the cookie. Invalid or expired tokens, refresh tokens used as access tokens, and tokens for deleted users return 401. Guest cards always have `isFavorite: false`.

Run `npm run test:recipes` with local PostgreSQL running. The integration tests use `.env`'s local `DATABASE_URL` (or `TEST_DATABASE_URL`), create a separate temporary database, and drop it afterward. They do not reset the development database or use Neon.

## Version control

Commit `prisma/schema.prisma`, `prisma/migrations/` including `migration_lock.toml`, `prisma/seed.ts`, `prisma/data/*.csv`, Prisma config, `package.json`, `package-lock.json`, `.env.example`, and the documentation. Do not commit environment files with credentials, generated client artifacts, or `node_modules`.

Diagram sources and the SVG are versioned; the optional PNG export is ignored.

## Backup policy

No separate initial `pg_dump` is included: the initial GoIT reference dataset is reproducible from versioned migrations and CSV seed. This is **not a replacement for backing up future user-created content**. Once the team starts creating non-reproducible data, establish a backup/restore procedure appropriate to the project.
