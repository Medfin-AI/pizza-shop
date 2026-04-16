export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-[var(--line)] bg-[var(--bg-warm)] px-4 py-10">
      <div className="page-wrap grid gap-6 sm:grid-cols-3">
        <div>
          <p className="font-display mb-1 text-lg font-bold italic text-[var(--text)]">
            Sal's Pizza
          </p>
          <p className="m-0 text-sm text-[var(--text-soft)]">
            Family recipes, made fresh daily.
          </p>
        </div>

        <div className="text-sm text-[var(--text-soft)]">
          <p className="m-0 font-semibold text-[var(--text)]">Hours</p>
          <p className="m-0 mt-1">Mon–Sat: 11am – 10pm</p>
          <p className="m-0">Sun: 12pm – 9pm</p>
        </div>

        <div className="text-sm text-[var(--text-soft)]">
          <p className="m-0 font-semibold text-[var(--text)]">Find us</p>
          <p className="m-0 mt-1">42 Mulberry Street</p>
          <p className="m-0">Little Italy, New York</p>
        </div>
      </div>

      <div className="page-wrap mt-8 border-t border-[var(--line)] pt-5">
        <p className="m-0 text-xs text-[var(--text-faint)]">
          &copy; {year} Sal's Pizza. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
