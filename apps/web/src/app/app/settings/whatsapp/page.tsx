"use server";

import Link from "next/link";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";

export default async function WhatsAppSettingsPage() {
  await requireSession();
  const branches = await listBranches();

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          Settings · WhatsApp
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">WhatsApp connections</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">
          Each branch has its own WhatsApp session. Manage them from each branch&apos;s detail page.
        </p>
      </section>

      {/* Sub-nav */}
      <nav className="flex gap-2 flex-wrap">
        <Link
          href="/app/settings/branch"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          Branch
        </Link>
        <Link
          href="/app/settings/language"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          Language
        </Link>
        <Link
          href="/app/settings/display"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          Display
        </Link>
        <Link
          href="/app/settings/notifications"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          Notifications
        </Link>
        <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white">
          WhatsApp
        </span>
        <Link
          href="/app/settings/gates"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          Smart Gates
        </Link>
      </nav>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <p className="mb-5 text-sm text-foreground/70">
          WhatsApp is connected per branch — each branch can have its own number. Select a branch below to connect or manage its WhatsApp session.
        </p>

        {branches.length === 0 ? (
          <p className="text-sm text-foreground/50">No branches yet. <Link href="/app/branches/new" className="text-brand underline-offset-2 hover:underline">Create your first branch</Link>.</p>
        ) : (
          <ul className="grid gap-3">
            {branches.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/app/branches/${b.id}`}
                  className="flex items-center justify-between rounded-2xl border border-line bg-white px-5 py-3.5 text-sm transition hover:border-brand hover:shadow-sm"
                >
                  <span className="font-medium">{b.name}</span>
                  <span className="text-xs text-foreground/50">{b.phone ?? "No phone set"} → Manage WhatsApp</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
