import { getUser } from "@/lib/users";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function UserDetailPage({ params }: Props) {
  const { userId } = await params;
  await requireSession();
  const t = await getT();
  const user = await getUser(userId);

  const roleBadgeStyle =
    user.role === "owner"
      ? "bg-brand/10 text-brand"
      : user.role === "manager"
      ? "bg-accent/10 text-accent"
      : "bg-gray-100 text-gray-600";

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.usersRoles}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeStyle}`}>
              {user.role}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground/60">{user.email}</p>
        </div>
        <Link
          href="/app/users"
          className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.users.allUsers}
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.users.staffDetails}
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.users.fullName}</dt>
              <dd className="mt-0.5 font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.users.email}</dt>
              <dd className="mt-0.5 font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.users.username}</dt>
              <dd className="mt-0.5 font-mono">{user.username}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.users.role}</dt>
              <dd className="mt-0.5 font-medium capitalize">{user.role}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.users.homeBranch}</dt>
              <dd className="mt-0.5 font-medium">{user.branch.name}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            System
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.users.userId}</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground/70">{user.id}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.users.tenant}</dt>
              <dd className="mt-0.5 font-medium">{user.tenant.name}</dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}
