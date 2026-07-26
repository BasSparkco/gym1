"use server";

import { listAnnouncements, deleteAnnouncement } from "@/lib/announcements";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Megaphone, Plus, Trash2, Send } from "lucide-react";

export default async function AnnouncementsPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const [announcements, branches] = await Promise.all([listAnnouncements(), listBranches()]);
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  async function handleDelete(formData: FormData) {
    "use server";
    const announcementId = formData.get("announcementId") as string;
    await deleteAnnouncement(announcementId);
    redirect("/app/announcements");
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.announcements}
        title={t.announcements.title}
        description={formatDict(t.announcements.listDescription, {
          count: announcements.length,
          plural: announcements.length !== 1 ? "s" : "",
        })}
        actions={
          <Button href="/app/announcements/new" variant="primary" icon={<Plus className="h-4 w-4" strokeWidth={2} />}>
            {t.announcements.newAnnouncement}
          </Button>
        }
      />

      {announcements.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-5 w-5" strokeWidth={2} />} title={t.announcements.noAnnouncements} />
      ) : (
        <div className="grid gap-3">
          {announcements.map((announcement, index) => (
            <Card
              key={announcement.id}
              animate
              delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
              className="!bg-white !px-5 !py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Megaphone className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{announcement.title}</p>
                    <p className="mt-1 text-sm text-foreground/60">{announcement.body}</p>
                    <p className="mt-2 text-xs text-foreground/40">
                      {new Date(announcement.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge tone="neutral">
                    {announcement.branchId
                      ? branchMap.get(announcement.branchId) ?? announcement.branchId
                      : t.announcements.allBranches}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-foreground/50">
                    <Send className="h-3 w-3" strokeWidth={2} />
                    {formatDict(t.announcements.pushSentCount, { count: announcement.pushSentCount })}
                  </span>
                  <form action={handleDelete}>
                    <input type="hidden" name="announcementId" value={announcement.id} />
                    <Button type="submit" variant="secondary" size="sm" icon={<Trash2 className="h-4 w-4" strokeWidth={2} />}>
                      {t.announcements.delete}
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
