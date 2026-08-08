"use client";

import { useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Send, Users, GraduationCap, Megaphone, Mail, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import type { Dict } from "@/lib/i18n";

type MemberOption = { id: string; fullName: string; memberNumber: string };
type CourseOption = { id: string; name: string; memberCount: number };

type RecipientType = "members" | "course" | "all";
type ChannelType = "whatsapp" | "email" | "app";
type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

function WhatsAppChannelIcon({ className }: { className?: string; strokeWidth?: number }) {
  return <WhatsAppIcon className={className} />;
}

const inputClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function NotificationSendForm({
  members,
  courses,
  apiBaseUrl,
  t,
}: {
  members: MemberOption[];
  courses: CourseOption[];
  apiBaseUrl: string;
  t: Dict;
}) {
  const router = useRouter();

  const [recipientType, setRecipientType] = useState<RecipientType>("members");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [channels, setChannels] = useState<ChannelType[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const selectedMembers = selectedMemberIds.map((id) => memberMap.get(id)).filter((m): m is MemberOption => !!m);

  const matches = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    const pool = members.filter((m) => !selectedMemberIds.includes(m.id));
    if (!q) return pool.slice(0, 8);
    return pool
      .filter((m) => m.fullName.toLowerCase().includes(q) || m.memberNumber.toLowerCase().includes(q))
      .slice(0, 8);
  }, [memberQuery, members, selectedMemberIds]);

  const canSend =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    channels.length > 0 &&
    (recipientType === "all" ||
      (recipientType === "members" && selectedMemberIds.length > 0) ||
      (recipientType === "course" && courseId !== ""));

  function toggleChannel(channel: ChannelType) {
    setChannels((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]));
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    setSuccessCount(null);
    try {
      const target =
        recipientType === "members"
          ? { type: "members" as const, memberIds: selectedMemberIds }
          : recipientType === "course"
            ? { type: "course" as const, programId: courseId }
            : { type: "all" as const };

      const res = await fetch(`${apiBaseUrl}/notifications/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, channels, target }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { recipientCount: number };
      setSuccessCount(data.recipientCount);
      setSubject("");
      setBody("");
      setSelectedMemberIds([]);
      setCourseId("");
      setChannels([]);
      router.refresh();
    } catch {
      setError(t.notifications.sendErrorGeneric);
    } finally {
      setSending(false);
    }
  }

  const recipientOptions: { value: RecipientType; label: string; icon: IconComponent }[] = [
    { value: "members", label: t.notifications.recipientMembers, icon: Users },
    { value: "course", label: t.notifications.recipientCourse, icon: GraduationCap },
    { value: "all", label: t.notifications.recipientAll, icon: Megaphone },
  ];

  const channelOptions: { value: ChannelType; label: string; icon: IconComponent }[] = [
    { value: "whatsapp", label: t.notifications.channelWhatsapp, icon: WhatsAppChannelIcon },
    { value: "email", label: t.notifications.channelEmail, icon: Mail },
    { value: "app", label: t.notifications.channelApp, icon: Smartphone },
  ];

  return (
    <div className="grid gap-5">
      <Card className="border-s-4 border-s-brand !px-7 !py-6">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
          {t.notifications.recipientsLabel}
        </h2>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {recipientOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setRecipientType(value);
                setError(null);
              }}
              className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-start text-sm font-semibold transition-colors ${
                recipientType === value
                  ? "border-brand bg-brand/5 text-brand"
                  : "border-line bg-white text-foreground/70 hover:border-brand/40"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {recipientType === "members" && (
          <div className="mt-4 grid gap-2.5">
            <label className="grid gap-1.5 text-sm">
              <span className="text-xs font-medium text-foreground/60">{t.notifications.membersPickerLabel}</span>
              <div className="relative">
                <input
                  value={memberQuery}
                  onChange={(e) => {
                    setMemberQuery(e.target.value);
                    setPickerOpen(true);
                  }}
                  onFocus={() => setPickerOpen(true)}
                  onBlur={() => setTimeout(() => setPickerOpen(false), 150)}
                  placeholder={t.notifications.membersPickerPlaceholder}
                  autoComplete="off"
                  className={inputClass}
                />
                {pickerOpen && matches.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-line bg-white py-1 shadow-lg">
                    {matches.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 text-start text-sm transition hover:bg-brand/5"
                          onMouseDown={() => {
                            setSelectedMemberIds((prev) => [...prev, m.id]);
                            setMemberQuery("");
                          }}
                        >
                          {m.fullName}{" "}
                          <span className="font-mono text-xs text-foreground/50">{m.memberNumber}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>

            {selectedMembers.length === 0 ? (
              <p className="text-xs text-foreground/50">{t.notifications.membersPickerEmpty}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white py-1 ps-3 pe-1.5 text-xs font-medium"
                  >
                    {m.fullName}
                    <button
                      type="button"
                      onClick={() => setSelectedMemberIds((prev) => prev.filter((id) => id !== m.id))}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-foreground/40 hover:bg-black/[0.06] hover:text-foreground"
                    >
                      <X className="h-3 w-3" strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {recipientType === "course" && (
          <label className="mt-4 grid gap-1.5 text-sm">
            <span className="text-xs font-medium text-foreground/60">{t.notifications.coursePickerLabel}</span>
            {courses.length === 0 ? (
              <p className="text-xs text-foreground/50">{t.notifications.coursePickerEmpty}</p>
            ) : (
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputClass}>
                <option value="">{t.notifications.coursePickerPlaceholder}</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.memberCount})
                  </option>
                ))}
              </select>
            )}
          </label>
        )}

        {recipientType === "all" && (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-surface-muted px-4 py-3 text-xs text-foreground/70">
            {t.notifications.allMembersNotice}
          </p>
        )}
      </Card>

      <Card className="border-s-4 border-s-blue-500 !px-7 !py-6">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
          {t.notifications.channelsLabel}
        </h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {channelOptions.map(({ value, label, icon: Icon }) => {
            const selected = channels.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleChannel(value)}
                aria-pressed={selected}
                className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-start text-sm font-semibold transition-colors ${
                  selected
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-line bg-white text-foreground/70 hover:border-brand/40"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="border-s-4 border-s-brand-deeper !px-7 !py-6">
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">{t.notifications.subjectLabel}</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t.notifications.subjectPlaceholder}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">{t.notifications.bodyLabel}</span>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t.notifications.bodyPlaceholder}
              className={inputClass}
            />
          </label>

          {error && <p className="text-xs text-danger">{error}</p>}
          {successCount !== null && (
            <p className="rounded-xl border border-line bg-surface-muted px-4 py-3 text-sm text-foreground">
              {t.notifications.sendSuccess}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              disabled={sending || !canSend}
              onClick={() => void handleSend()}
              icon={<Send className="h-3.5 w-3.5" strokeWidth={2} />}
            >
              {recipientType === "members" && selectedMemberIds.length > 0
                ? t.notifications.sendButtonCount
                    .replace("{count}", String(selectedMemberIds.length))
                    .replace("{plural}", selectedMemberIds.length !== 1 ? "s" : "")
                : t.notifications.sendButton}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
