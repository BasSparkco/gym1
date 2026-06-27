import { getBranch } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/countries";
import Link from "next/link";
import WhatsAppCard from "./WhatsAppCard";

type Props = {
  params: Promise<{ branchId: string }>;
};

export default async function BranchDetailPage({ params }: Props) {
  const { branchId } = await params;
  const session = await requireSession();
  const t = await getT();
  const branch = await getBranch(branchId);
  const canManage = session.role === "owner" || session.role === "manager";
  const countryName = branch.countryCode
    ? (COUNTRIES.find((c) => c.code === branch.countryCode)?.name ?? branch.countryCode)
    : null;

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.branches}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{branch.name}</h1>
            <span
              className={[
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                branch.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500",
              ].join(" ")}
            >
              {branch.status === "active" ? t.status.active : t.status.inactive}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Link
              href={`/app/branches/${branch.id}/edit`}
              className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              {t.branches.editBranchBtn}
            </Link>
          )}
          <Link
            href="/app/branches"
            className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            {t.branches.allBranches}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.branches.details}
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">Name</dt>
              <dd className="mt-0.5 font-medium">{branch.name}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.branches.address}</dt>
              <dd className="mt-0.5 font-medium">{branch.address ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.branches.phone}</dt>
              <dd className="mt-0.5 font-medium">{branch.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.branches.country}</dt>
              <dd className="mt-0.5 font-medium">{countryName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.branches.statusLabel}</dt>
              <dd className="mt-0.5 font-medium capitalize">{branch.status}</dd>
            </div>
          </dl>
        </article>

        <WhatsAppCard branchId={branch.id} canManage={canManage} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            System
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.branches.branchId}</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground/70">{branch.id}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.branches.tenantId}</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground/70">{branch.tenantId}</dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}
