import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.notNull()
		.default(false),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
	},
	(table) => [
		index("account_user_id_idx").on(table.userId),
		uniqueIndex("account_provider_account_unique").on(
			table.providerId,
			table.accountId,
		),
	],
);

export const verification = sqliteTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
	},
	(table) => [
		index("verification_identifier_idx").on(table.identifier),
		uniqueIndex("verification_identifier_value_unique").on(
			table.identifier,
			table.value,
		),
	],
);

export const pizzaSizes = sqliteTable("pizza_sizes", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	priceCents: integer("price_cents").notNull(),
	includedToppings: integer("included_toppings").notNull().default(0),
	pricePerAdditionalToppingCents: integer("price_per_additional_topping_cents")
		.notNull()
		.default(0),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const toppings = sqliteTable("toppings", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	description: text("description").notNull(),
});

export const orders = sqliteTable(
	"orders",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		address: text("address").notNull().default(""),
		totalPriceCents: integer("total_price_cents").notNull(),
		status: text("status").notNull().default("placed"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
	},
	(table) => [index("orders_user_id_idx").on(table.userId)],
);

export const pizzas = sqliteTable(
	"pizzas",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		sizeId: integer("size_id")
			.notNull()
			.references(() => pizzaSizes.id, { onDelete: "restrict" }),
		quantity: integer("quantity").notNull().default(1),
		specialInstructions: text("special_instructions"),
		basePriceCents: integer("base_price_cents").notNull(),
		includedToppings: integer("included_toppings").notNull(),
		pricePerAdditionalToppingCents: integer(
			"price_per_additional_topping_cents",
		).notNull(),
		toppingsCount: integer("toppings_count").notNull().default(0),
		lineTotalPriceCents: integer("line_total_price_cents").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
	},
	(table) => [index("pizzas_size_id_idx").on(table.sizeId)],
);

export const ordersToPizzas = sqliteTable(
	"orders_to_pizzas",
	{
		orderId: integer("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		pizzaId: integer("pizza_id")
			.notNull()
			.references(() => pizzas.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.orderId, table.pizzaId] })],
);

export const pizzasToToppings = sqliteTable(
	"pizzas_to_toppings",
	{
		pizzaId: integer("pizza_id")
			.notNull()
			.references(() => pizzas.id, { onDelete: "cascade" }),
		toppingId: integer("topping_id")
			.notNull()
			.references(() => toppings.id, { onDelete: "restrict" }),
	},
	(table) => [primaryKey({ columns: [table.pizzaId, table.toppingId] })],
);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	orders: many(orders),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const pizzaSizesRelations = relations(pizzaSizes, ({ many }) => ({
	pizzas: many(pizzas),
}));

export const toppingsRelations = relations(toppings, ({ many }) => ({
	pizzasToToppings: many(pizzasToToppings),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
	user: one(user, {
		fields: [orders.userId],
		references: [user.id],
	}),
	orderPizzas: many(ordersToPizzas),
}));

export const pizzasRelations = relations(pizzas, ({ one, many }) => ({
	size: one(pizzaSizes, {
		fields: [pizzas.sizeId],
		references: [pizzaSizes.id],
	}),
	orderPizzas: many(ordersToPizzas),
	pizzaToppings: many(pizzasToToppings),
}));

export const ordersToPizzasRelations = relations(ordersToPizzas, ({ one }) => ({
	order: one(orders, {
		fields: [ordersToPizzas.orderId],
		references: [orders.id],
	}),
	pizza: one(pizzas, {
		fields: [ordersToPizzas.pizzaId],
		references: [pizzas.id],
	}),
}));

export const pizzasToToppingsRelations = relations(
	pizzasToToppings,
	({ one }) => ({
		pizza: one(pizzas, {
			fields: [pizzasToToppings.pizzaId],
			references: [pizzas.id],
		}),
		topping: one(toppings, {
			fields: [pizzasToToppings.toppingId],
			references: [toppings.id],
		}),
	}),
);
