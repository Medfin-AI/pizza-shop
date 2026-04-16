import { authClient } from "#/lib/auth-client";
import { auth } from "#/lib/auth";
import { db } from "#/db";
import {
  orders,
  ordersToPizzas,
  pizzaSizes,
  pizzas,
  pizzasToToppings,
  toppings,
} from "#/db/schema";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { desc, eq, inArray } from "drizzle-orm";
import {
  Check,
  CheckCircle,
  Clock,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

const placeOrderInputSchema = z.object({
  sizeId: z.number().int().positive(),
  toppingIds: z.array(z.number().int().positive()).max(20),
  quantity: z.number().int().min(1).max(10),
  address: z.string().trim().min(1, "Address is required").max(500),
  specialInstructions: z.string().trim().max(240).optional(),
});

const getMenuData = createServerFn({ method: "GET" }).handler(async () => {
  const [sizes, availableToppings] = await Promise.all([
    db.query.pizzaSizes.findMany({
      orderBy: (table, { asc }) => [asc(table.priceCents)],
    }),
    db.query.toppings.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
  ]);

  return {
    sizes,
    toppings: availableToppings,
  };
});

const getMyOrders = createServerFn({ method: "GET" }).handler(async () => {
  const currentSession = await auth.api.getSession({
    headers: getRequestHeaders(),
  });

  if (!currentSession?.user) {
    return [];
  }

  return await db.query.orders.findMany({
    where: eq(orders.userId, currentSession.user.id),
    orderBy: [desc(orders.createdAt)],
    with: {
      orderPizzas: {
        with: {
          pizza: {
            with: {
              size: true,
              pizzaToppings: {
                with: {
                  topping: true,
                },
              },
            },
          },
        },
      },
    },
  });
});

const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => placeOrderInputSchema.parse(data))
  .handler(async ({ data }) => {
    const currentSession = await auth.api.getSession({
      headers: getRequestHeaders(),
    });

    if (!currentSession?.user) {
      throw new Error("You must be signed in to place an order.");
    }

    const size = await db.query.pizzaSizes.findFirst({
      where: eq(pizzaSizes.id, data.sizeId),
    });

    if (!size) {
      throw new Error("Selected pizza size no longer exists.");
    }

    const uniqueToppingIds = [...new Set(data.toppingIds)];

    const selectedToppings = uniqueToppingIds.length
      ? await db.query.toppings.findMany({
          where: inArray(toppings.id, uniqueToppingIds),
        })
      : [];

    if (selectedToppings.length !== uniqueToppingIds.length) {
      throw new Error("One or more selected toppings are invalid.");
    }

    const additionalToppingsCount = Math.max(
      0,
      selectedToppings.length - size.includedToppings,
    );

    const unitPriceCents =
      size.priceCents +
      additionalToppingsCount * size.pricePerAdditionalToppingCents;
    const lineTotalPriceCents = unitPriceCents * data.quantity;

    const orderId = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          userId: currentSession.user.id,
          address: data.address,
          totalPriceCents: lineTotalPriceCents,
          status: "placed",
        })
        .returning({ id: orders.id });

      const [pizza] = await tx
        .insert(pizzas)
        .values({
          sizeId: size.id,
          quantity: data.quantity,
          specialInstructions: data.specialInstructions || null,
          basePriceCents: size.priceCents,
          includedToppings: size.includedToppings,
          pricePerAdditionalToppingCents: size.pricePerAdditionalToppingCents,
          toppingsCount: selectedToppings.length,
          lineTotalPriceCents,
        })
        .returning({ id: pizzas.id });

      await tx.insert(ordersToPizzas).values({
        orderId: order.id,
        pizzaId: pizza.id,
      });

      if (selectedToppings.length > 0) {
        await tx.insert(pizzasToToppings).values(
          selectedToppings.map((topping) => ({
            pizzaId: pizza.id,
            toppingId: topping.id,
          })),
        );
      }

      return order.id;
    });

    return {
      orderId,
      totalPriceCents: lineTotalPriceCents,
    };
  });

export const Route = createFileRoute("/")({
  loader: async () => {
    const [menu, myOrders] = await Promise.all([getMenuData(), getMyOrders()]);

    return {
      ...menu,
      myOrders,
    };
  },
  component: App,
});

function App() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const {
    sizes,
    toppings: availableToppings,
    myOrders,
  } = Route.useLoaderData();

  const [selectedSizeId, setSelectedSizeId] = useState<number>(
    sizes[0]?.id ?? 0,
  );
  const [selectedToppingIds, setSelectedToppingIds] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);

  useEffect(() => {
    if (session?.user) {
      void router.invalidate();
    }
  }, [session?.user?.id, router, session?.user]);

  const selectedSize = useMemo(
    () => sizes.find((size) => size.id === selectedSizeId) ?? null,
    [selectedSizeId, sizes],
  );

  const priceBreakdown = useMemo(() => {
    if (!selectedSize) {
      return {
        unitPriceCents: 0,
        lineTotalPriceCents: 0,
        additionalToppingsCount: 0,
      };
    }

    const additionalToppingsCount = Math.max(
      0,
      selectedToppingIds.length - selectedSize.includedToppings,
    );

    const unitPriceCents =
      selectedSize.priceCents +
      additionalToppingsCount * selectedSize.pricePerAdditionalToppingCents;

    return {
      unitPriceCents,
      lineTotalPriceCents: unitPriceCents * quantity,
      additionalToppingsCount,
    };
  }, [quantity, selectedSize, selectedToppingIds.length]);

  const toggleTopping = (toppingId: number) => {
    setSelectedToppingIds((currentIds) => {
      if (currentIds.includes(toppingId)) {
        return currentIds.filter((id) => id !== toppingId);
      }

      return [...currentIds, toppingId];
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSize) {
      setFeedbackIsError(true);
      setFeedback("No pizza size is available yet.");
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await placeOrder({
        data: {
          sizeId: selectedSize.id,
          toppingIds: selectedToppingIds,
          quantity,
          address: address.trim(),
          specialInstructions: specialInstructions.trim() || undefined,
        },
      });

      setSelectedToppingIds([]);
      setQuantity(1);
      setAddress("");
      setSpecialInstructions("");
      setFeedbackIsError(false);
      setFeedback(
        `Order #${result.orderId} placed — ${formatCurrency(result.totalPriceCents)}. We're on it!`,
      );

      await router.invalidate();
    } catch (error) {
      setFeedbackIsError(true);
      setFeedback(
        error instanceof Error ? error.message : "Failed to place order.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isSignedIn = !!session?.user;

  if (sessionPending || !isSignedIn) {
    return (
      <main className="page-wrap px-4 pb-12 pt-10">
        <section className="rise-in mx-auto max-w-lg py-16 text-center">
          <p className="kicker mb-3">Sal's Pizza</p>
          <h1 className="font-display mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Fresh pies,
            <br />
            made to order
          </h1>
          <p className="mx-auto mb-8 max-w-sm text-[var(--text-soft)]">
            Sign in to build your perfect pizza and track your orders.
          </p>
          <Link
            to="/auth"
            className="inline-block rounded-full bg-[var(--accent)] px-8 py-3 text-sm font-bold text-[var(--accent-text)] no-underline shadow-sm transition hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.98]"
          >
            Sign in to order
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      {/* Hero */}
      <section className="mb-8 rise-in">
        <p className="kicker mb-2">Sal's Pizza</p>
        <h1 className="font-display mb-2 text-4xl font-bold tracking-tight sm:text-5xl">
          What are you craving?
        </h1>
        <p className="max-w-xl text-[var(--text-soft)]">
          Pick your perfect pie — we'll handle the rest.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* ── Order form ─────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Size selection */}
          <section className="rise-in" style={{ animationDelay: "80ms" }}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--text-faint)]">
              Choose your size
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {sizes.map((size) => {
                const isSelected = size.id === selectedSizeId;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSizeId(size.id)}
                    className={`relative cursor-pointer rounded-2xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent-surface)] shadow-sm"
                        : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <span className="block text-sm font-semibold text-[var(--text)]">
                      {size.name}
                    </span>
                    <span className="font-display mt-1 block text-2xl font-bold text-[var(--accent)]">
                      {formatCurrency(size.priceCents)}
                    </span>
                    <span className="mt-2 block text-xs text-[var(--text-soft)]">
                      {size.includedToppings} topping
                      {size.includedToppings !== 1 ? "s" : ""} included
                    </span>
                    <span className="block text-xs text-[var(--text-faint)]">
                      {formatCurrency(size.pricePerAdditionalToppingCents)} per
                      extra
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Topping selection */}
          <section className="rise-in" style={{ animationDelay: "140ms" }}>
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-[var(--text-faint)]">
              Add toppings
            </h2>
            {selectedSize && (
              <p className="mb-3 text-sm text-[var(--text-soft)]">
                {selectedSize.includedToppings} included with your{" "}
                {sizes
                  .find((s) => s.id === selectedSizeId)
                  ?.name?.split(" (")[0]
                  ?.toLowerCase()}
                , then{" "}
                {formatCurrency(selectedSize.pricePerAdditionalToppingCents)}{" "}
                each.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {availableToppings.map((topping) => {
                const isSelected = selectedToppingIds.includes(topping.id);
                return (
                  <button
                    key={topping.id}
                    type="button"
                    onClick={() => toggleTopping(topping.id)}
                    title={topping.description}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-sm"
                        : "border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    )}
                    {topping.name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Delivery address */}
          <section className="rise-in" style={{ animationDelay: "200ms" }}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--text-faint)]">
              Delivery address
            </h2>
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
              maxLength={500}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--line-strong)] focus:outline-none"
              placeholder="42 Mulberry Street, Apt 3B"
            />
          </section>

          {/* Quantity + special instructions */}
          <section
            className="rise-in grid gap-6 sm:grid-cols-2"
            style={{ animationDelay: "240ms" }}
          >
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--text-faint)]">
                How many?
              </h2>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-display w-8 text-center text-2xl font-bold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  disabled={quantity >= 10}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--text-faint)]">
                Special requests
              </h2>
              <textarea
                value={specialInstructions}
                onChange={(event) => setSpecialInstructions(event.target.value)}
                maxLength={240}
                rows={2}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--line-strong)] focus:outline-none"
                placeholder="Extra crispy, cut into squares..."
              />
            </div>
          </section>

          {/* Price summary + submit */}
          <section className="rise-in" style={{ animationDelay: "300ms" }}>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-5">
              <div className="flex items-baseline justify-between text-sm text-[var(--text-soft)]">
                <span>Base ({selectedSize?.name ?? "—"})</span>
                <span>{formatCurrency(selectedSize?.priceCents ?? 0)}</span>
              </div>
              {priceBreakdown.additionalToppingsCount > 0 && (
                <div className="mt-1 flex items-baseline justify-between text-sm text-[var(--text-soft)]">
                  <span>
                    + {priceBreakdown.additionalToppingsCount} extra topping
                    {priceBreakdown.additionalToppingsCount !== 1 ? "s" : ""}
                  </span>
                  <span>
                    {formatCurrency(
                      priceBreakdown.additionalToppingsCount *
                        (selectedSize?.pricePerAdditionalToppingCents ?? 0),
                    )}
                  </span>
                </div>
              )}
              {quantity > 1 && (
                <div className="mt-1 flex items-baseline justify-between text-sm text-[var(--text-soft)]">
                  <span>&times; {quantity}</span>
                  <span />
                </div>
              )}
              <div className="mt-3 flex items-baseline justify-between border-t border-[var(--line)] pt-3">
                <span className="font-semibold">Total</span>
                <span className="font-display text-2xl font-bold text-[var(--accent)]">
                  {formatCurrency(priceBreakdown.lineTotalPriceCents)}
                </span>
              </div>
            </div>

            {feedback && (
              <div
                className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                  feedbackIsError
                    ? "border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]"
                    : "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]"
                }`}
              >
                {!feedbackIsError && (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{feedback}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || sizes.length === 0}
              className="mt-4 w-full cursor-pointer rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--accent-text)] shadow-sm transition hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Placing order..." : "Place order"}
            </button>
          </section>
        </form>

        {/* ── Order history ──────────────────────────── */}
        <aside className="rise-in" style={{ animationDelay: "340ms" }}>
          <div className="card sticky top-20 rounded-2xl p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[var(--text-faint)]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-faint)]">
                Your orders
              </h2>
            </div>

            {myOrders.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-[var(--text-faint)]">
                  No orders yet — your first one is just a click away.
                </p>
              </div>
            ) : (
              <ul className="m-0 grid list-none gap-3 p-0">
                {myOrders.map((order) => (
                  <li
                    key={order.id}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-bold">
                        Order #{order.id}
                      </span>
                      <span className="font-display font-bold text-[var(--accent)]">
                        {formatCurrency(order.totalPriceCents)}
                      </span>
                    </div>
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
                      <Clock className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                    {order.address && (
                      <p className="mb-2 mt-0 text-xs text-[var(--text-faint)]">
                        {order.address}
                      </p>
                    )}
                    {order.orderPizzas.map((orderPizza) => {
                      const pizza = orderPizza.pizza;
                      const toppingNames = pizza.pizzaToppings.map(
                        (pizzaTopping) => pizzaTopping.topping.name,
                      );

                      return (
                        <div
                          key={pizza.id}
                          className="text-sm text-[var(--text-soft)]"
                        >
                          <span>
                            {pizza.quantity}&times; {pizza.size.name}
                          </span>
                          {toppingNames.length > 0 && (
                            <p className="m-0 mt-0.5 text-xs text-[var(--text-faint)]">
                              {toppingNames.join(", ")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
