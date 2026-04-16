import { Link } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";
import { authClient } from "#/lib/auth-client";

export default function BetterAuthHeader() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <span className="text-xs text-[var(--text-faint)]">...</span>;
	}

	if (!session?.user) {
		return (
			<Link
				to="/auth"
				className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 text-sm font-semibold text-[var(--text)] no-underline transition hover:bg-[var(--surface-hover)]"
			>
				<User className="h-3.5 w-3.5" />
				Sign in
			</Link>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<span className="hidden text-sm text-[var(--text-soft)] sm:inline">
				{session.user.email}
			</span>
			<button
				type="button"
				onClick={() => {
					void authClient.signOut();
				}}
				className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
				title="Sign out"
				aria-label="Sign out"
			>
				<LogOut className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}
