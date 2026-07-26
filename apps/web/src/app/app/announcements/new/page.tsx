"use server";

import { createAnnouncement } from "@/lib/announcements";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default async function NewAnnouncementPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const branches = await listBranches();

  async function handleCreate(formData: FormData) {
    "use server";
    const title = (formData.get("title") as string).trim();
    const body = (formData.get("body") as string).trim();
    const branchId = (formData.get("branchId") as string) || undefined;

    await createAnnouncement({ branchId, title, body });

    redirect("/app/announcements");
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.announcements}
        title={t.announcements.newAnnouncement}
        description={t.announcements.newAnnouncementDescription}
      />

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              {t.announcements.announcementTitle} <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder={t.announcements.titlePlaceholder}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="body" className="text-sm font-medium">
              {t.announcements.body} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={4}
              placeholder={t.announcements.bodyPlaceholder}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid gap-1.5 sm:max-w-xs">
            <label htmlFor="branchId" className="text-sm font-medium">
              {t.announcements.branch}
            </label>
            <select
              id="branchId"
              name="branchId"
              defaultValue=""
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">{t.announcements.allBranches}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<Send className="h-4 w-4" strokeWidth={2} />}>
              {t.announcements.sendAnnouncement}
            </Button>
            <Button href="/app/announcements" variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
