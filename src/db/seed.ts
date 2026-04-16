import { db } from "./index";
import { pizzaSizes, toppings } from "./schema";

async function seed() {
	await db
		.insert(pizzaSizes)
		.values([
			{
				name: 'Small (10")',
				priceCents: 1099,
				includedToppings: 1,
				pricePerAdditionalToppingCents: 150,
			},
			{
				name: 'Medium (12")',
				priceCents: 1399,
				includedToppings: 2,
				pricePerAdditionalToppingCents: 175,
			},
			{
				name: 'Large (14")',
				priceCents: 1799,
				includedToppings: 3,
				pricePerAdditionalToppingCents: 200,
			},
		])
		.onConflictDoNothing({ target: pizzaSizes.name });

	await db
		.insert(toppings)
		.values([
			{
				name: "Pepperoni",
				description: "Classic pepperoni slices.",
			},
			{
				name: "Mushrooms",
				description: "Fresh sliced mushrooms.",
			},
			{
				name: "Onions",
				description: "Thinly sliced red onions.",
			},
			{
				name: "Bell Peppers",
				description: "Green bell peppers, lightly roasted.",
			},
			{
				name: "Sausage",
				description: "Italian sausage crumbles.",
			},
			{
				name: "Black Olives",
				description: "Sliced black olives.",
			},
			{
				name: "Jalapenos",
				description: "Pickled jalapeno rounds.",
			},
			{
				name: "Extra Cheese",
				description: "Mozzarella blend.",
			},
		])
		.onConflictDoNothing({ target: toppings.name });

	console.info("Seeded pizza sizes and toppings.");
}

seed()
	.catch((error) => {
		console.error("Failed to seed database:", error);
		process.exit(1);
	})
	.then(() => {
		process.exit(0);
	});
