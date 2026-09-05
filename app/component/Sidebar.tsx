import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950 p-5">
      <div className="mb-10">
        <h1 className="text-xl font-bold text-white">
          Trading Journal
        </h1>

        <p className="mt-1 text-xs text-zinc-500">
          Track. Analyze. Improve.
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="rounded-lg px-4 py-3 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
        >
          Dashboard
        </Link>

        <Link
          href="/trades"
          className="rounded-lg px-4 py-3 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
        >
          Trades
        </Link>

        <Link
          href="/analytics"
          className="rounded-lg px-4 py-3 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
        >
          Analytics
        </Link>
      </nav>

      <div className="mt-auto border-t border-zinc-800 pt-4">
        <LogoutButton />
      </div>
    </aside>
  );
}