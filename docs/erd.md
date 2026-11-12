# Foodies — Entity Relationship Diagram

The diagram uses PostgreSQL table and column names from the current schema, created by `20261112010000_init`. Prisma exposes `UserFollow` as `prisma.userFollow` while storing it in `follows`; `Ingredient.desc` is stored in `ingredients.description`.

```mermaid
erDiagram
    users ||--o{ refresh_tokens : authenticates
    users ||--o{ recipes : creates
    users ||--o{ testimonials : writes
    users ||--o{ favorites : saves
    users ||--o{ follows : follower
    users ||--o{ follows : followed

    categories ||--o{ recipes : categorizes
    areas ||--o{ recipes : originates
    recipes ||--o{ recipe_ingredients : consists_of
    ingredients ||--o{ recipe_ingredients : used_in
    recipes ||--o{ favorites : is_saved

    users {
      varchar36 id PK
      varchar name
      varchar email UK
      text password "required bcrypt hash"
      text avatar
      timestamp created_at
      timestamp updated_at
    }
    refresh_tokens {
      int id PK
      text token UK
      varchar36 user_id FK
      timestamp expires_at
      timestamp created_at
    }
    categories {
      varchar36 id PK
      varchar name UK
      text description
      text thumb
    }
    areas {
      varchar36 id PK
      varchar name UK
    }
    ingredients {
      varchar36 id PK
      varchar name
      text description
      text img
    }
    recipes {
      varchar36 id PK
      varchar title
      varchar36 category_id FK
      varchar36 area_id FK
      varchar36 owner_id FK
      text instructions
      text description
      text thumb
      text preview
      int time
      timestamp created_at
      timestamp updated_at
    }
    recipe_ingredients {
      varchar36 recipe_id PK,FK
      varchar36 ingredient_id PK,FK
      varchar measure
    }
    favorites {
      varchar36 user_id PK,FK
      varchar36 recipe_id PK,FK
    }
    follows {
      varchar36 follower_id PK,FK
      varchar36 following_id PK,FK
    }
    testimonials {
      varchar36 id PK
      varchar36 owner_id FK
      text testimonial
    }
```

String IDs and their foreign keys allow 36 characters. Prisma generates UUIDs for new standalone string primary keys; seed explicitly preserves the original 24-character IDs.

`refresh_tokens.user_id` has a non-unique index, so a user can have multiple sessions. Each token has a unique value, required `expires_at`, and automatic `created_at`.

Nullable columns are `users.avatar`, `categories.description`, `categories.thumb`, `ingredients.description`, `ingredients.img`, `recipes.description`, `recipes.thumb`, `recipes.preview`, `recipes.time`, and `recipe_ingredients.measure`. `users.password` is required; seeded profiles receive hashes of discarded random passwords. Refer to [schema.prisma](../prisma/schema.prisma) for authoritative types and optionality.
