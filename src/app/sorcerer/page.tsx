import Link from "next/link";

export const metadata = {
  title: "RLY LABS — Sorcerer",
  description: "Sorcerer 🧙 — an experiment by rly labs.",
};

export default function SorcererPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-stone-100 text-zinc-950">
      <header className="shrink-0 border-b border-black/5 px-6 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">
              🧙 Sorcerer
            </h1>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              An experiment by rly labs
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/prism"
              className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium text-zinc-500 shadow-sm transition hover:text-zinc-950"
            >
              Prism →
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="text-5xl" aria-hidden>
          🧙
        </span>
        <h2 className="mt-4 text-lg font-medium text-zinc-800">
          Nothing conjured yet
        </h2>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          This is where Sorcerer will live.
        </p>
      </section>
    </main>
  );
}
