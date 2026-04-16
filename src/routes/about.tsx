import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<main className="page-wrap px-4 py-12">
			<section className="rise-in mx-auto max-w-2xl">
				<p className="kicker mb-2">Our Story</p>
				<h1 className="font-display mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
					Three generations of
					<br />
					<em className="text-[var(--accent)]">Calabrese tradition</em>
				</h1>

				<div className="space-y-5 text-base leading-relaxed text-[var(--text-soft)]">
					<p>
						Sal opened these doors in 1987 with nothing but his grandmother's
						dough recipe and a secondhand deck oven. What started as a six-table
						shop on Mulberry Street has become a Little Italy landmark — and
						every pizza is still made the way Nonna taught him.
					</p>

					<p>
						The dough rises slowly overnight. The sauce is San Marzano tomatoes,
						garlic, olive oil, and a pinch of sugar — nothing more. The
						mozzarella comes fresh from the same dairy in Brooklyn that Sal's
						father used before him.
					</p>

					<p>
						We don't rush. We don't cut corners. Every pie that leaves our
						kitchen has our family's name on it, and we take that seriously.
					</p>
				</div>

				<div className="divider my-10">Since 1987</div>

				<div className="grid gap-6 sm:grid-cols-3">
					<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
						<p className="font-display mb-1 text-2xl font-bold text-[var(--accent)]">
							Fresh daily
						</p>
						<p className="m-0 text-sm text-[var(--text-soft)]">
							Dough made every morning. Sauce simmered from scratch. No
							shortcuts.
						</p>
					</div>
					<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
						<p className="font-display mb-1 text-2xl font-bold text-[var(--accent)]">
							Family-run
						</p>
						<p className="m-0 text-sm text-[var(--text-soft)]">
							Three generations in the kitchen. Same recipes, same love, same
							Mulberry Street.
						</p>
					</div>
					<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
						<p className="font-display mb-1 text-2xl font-bold text-[var(--accent)]">
							Community
						</p>
						<p className="m-0 text-sm text-[var(--text-soft)]">
							Every customer is family. That's not a slogan — it's how Sal
							raised us.
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
