import { listUsers } from "@/lib/users";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";

export default async function UsersPage() {
  const session = await requireSession();
  const t = await getT();
  const users = await listUsers();
  const canCreate = session.role === "owner";

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.usersRoles}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.users.staffUsers}</h1>
          <p className="mt-2 text-sm leading-7 text-foreground/70">
            {users.length} staff account{users.length !== 1 ? "s" : ""} in {session.tenant.name}.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/app/users/new"
            className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            {t.users.newUser}
          </Link>
        )}
      </section>

      <section className="grid gap-3">
        {users.length === 0 && (
          <div className="rounded-[2rem] border border-line bg-surface px-6 py-10 text-center text-sm text-foreground/60">
            {t.users.noUsers}
          </div>
        )}
        {users.map((user) => (
          <article
            key={user.id}
            className="rounded-[1.75rem] border border-line bg-surface px-6 py-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{user.name}</h2>
                  <span
                    className={[
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      user.role === "owner"
                        ? "bg-brand/10 text-brand"
                        : user.role === "manager"
                        ? "bg-accent/10 text-accent"
                        : "bg-gray-100 text-gray-600",
                    ].join(" ")}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/55">{user.email}</p>
                <p className="mt-0.5 text-sm text-foreground/45">
                  {t.users.homeBranch}: {user.branch.name}
                </p>
              </div>
              {user.id !== session.id && (
                <Link
                  href={`/app/users/${user.id}`}
                  className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
                >
                  {t.actions.view}
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>

      <section>
        <Link
          href="/app/roles"
          className="text-sm font-medium text-brand underline-offset-4 hover:underline"
        >
          {t.users.viewRoles}
        </Link>
      </section>
    </div>
  );
}
