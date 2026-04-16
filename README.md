# Sal's Pizza (TanStack Start + SQLite + Drizzle + Better Auth)

A TanStack Start app for pizza ordering with account-based login.

## Features

- Email/password account management with Better Auth
- SQLite-backed persistence via Drizzle ORM
- Pizza ordering flow collecting:
  - size
  - toppings
  - quantity
  - optional special instructions
- Server-side price calculation using:
  - size base price
  - included toppings per size
  - per-additional-topping price
- Order history for the signed-in user

## Database schema

The app includes these core pizza tables:

- `orders`
- `pizzas`
- `pizza_sizes`
- `toppings`
- `orders_to_pizzas` (join)
- `pizzas_to_toppings` (join)

It also includes Better Auth tables:

- `user`
- `session`
- `account`
- `verification`

## Quick start

1. Install dependencies:

```bash
bun install
```

2. Generate and apply migrations:

```bash
bun run db:generate
bun run db:migrate
```

3. Seed pizza sizes and toppings:

```bash
bun run db:seed
```

4. Start the app:

```bash
bun run dev
```

Then open `http://localhost:3000`, create an account in `/auth`, and place orders from `/`.
