import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Access your TransitOps workspace.
        </p>

        <form className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Email
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-zinc-400">
          <Link href="/" className="font-medium underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
