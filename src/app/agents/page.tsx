import Link from "next/link";

export const metadata = {
  title: "RLY LABS — Agents",
  description: "Agents built and run by rly labs.",
};

export default function AgentsPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-stone-100 text-zinc-950">
      <header className="shrink-0 border-b border-black/5 px-6 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">Agents</h1>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              Agents built and run by rly labs
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
        <h2 className="text-lg font-medium text-zinc-800">No agents yet</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          This is where rly labs agents will live.
        </p>
      </section>
    </main>
  );
}
