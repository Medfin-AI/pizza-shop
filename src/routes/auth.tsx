import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { data: session, isPending } = authClient.useSession();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isPending) {
    return (
      <main className="page-wrap px-4 py-10">
        <p className="text-sm text-[var(--text-soft)]">Loading...</p>
      </main>
    );
  }

  if (session?.user) {
    return (
      <main className="page-wrap px-4 py-10">
        <section className="card mx-auto max-w-md rounded-2xl p-6 sm:p-8">
          <p className="kicker mb-2">Account</p>
          <h1 className="font-display mb-1 text-3xl font-bold">Welcome back</h1>
          <p className="mb-6 text-[var(--text-soft)]">{session.user.email}</p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-[var(--accent-text)] no-underline transition hover:bg-[var(--accent-hover)]"
            >
              Place an order
            </Link>
            <button
              type="button"
              onClick={() => {
                void authClient.signOut();
              }}
              className="cursor-pointer rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-hover)]"
            >
              Sign out
            </button>
          </div>
        </section>
      </main>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({
          email,
          password,
          name,
        });

        if (result.error) {
          setError(result.error.message ?? "Could not sign up.");
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        });

        if (result.error) {
          setError(result.error.message ?? "Could not sign in.");
        }
      }
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrap px-4 py-10">
      <section className="card rise-in mx-auto max-w-md rounded-2xl p-6 sm:p-8">
        <p className="kicker mb-2">
          {isSignUp ? "Join the family" : "Welcome back"}
        </p>
        <h1 className="font-display mb-1 text-3xl font-bold">
          {isSignUp ? "Create your account" : "Sign in"}
        </h1>
        <p className="mb-6 text-sm text-[var(--text-soft)]">
          {isSignUp
            ? "Sign up so you can start ordering."
            : "Sign in to place and track your pizza orders."}
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {isSignUp && (
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-[var(--text)]">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--line-strong)] focus:outline-none"
              />
            </label>
          )}

          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-[var(--text)]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--line-strong)] focus:outline-none"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-[var(--text)]">Password</span>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--line-strong)] focus:outline-none"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-2 text-sm text-[var(--error-text)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 cursor-pointer rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-[var(--accent-text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "Working..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="divider mt-6 mb-4" />

        <button
          type="button"
          onClick={() => {
            setError("");
            setIsSignUp((value) => !value);
          }}
          className="w-full cursor-pointer text-center text-sm text-[var(--text-soft)] transition hover:text-[var(--accent)]"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </section>
    </main>
  );
}
