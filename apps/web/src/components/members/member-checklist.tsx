"use client";

import { useMemo, useState } from "react";

export type MemberChecklistOption = {
  id: string;
  fullName: string;
  memberNumber: string;
  status?: "active" | "inactive";
};

type Props = {
  name: string;
  members: MemberChecklistOption[];
  defaultSelectedIds: string[];
  searchPlaceholder: string;
  noMatchesLabel: string;
  selectedCountTemplate: string; // e.g. "{count} member(s) selected"
  showSelectedOnlyLabel: string;
  inactiveLabel: string;
};

/** Searchable, multi-select member checklist for server-action forms. All
 * checkboxes stay mounted at all times — filtering only toggles CSS
 * visibility — so a checked item filtered out of view is still submitted. */
export default function MemberChecklist({
  name,
  members,
  defaultSelectedIds,
  searchPlaceholder,
  noMatchesLabel,
  selectedCountTemplate,
  showSelectedOnlyLabel,
  inactiveLabel,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelectedIds));
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const sorted = useMemo(
    () => [...members].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [members],
  );

  const q = query.trim().toLowerCase();
  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of sorted) {
      const matchesQuery =
        !q || m.fullName.toLowerCase().includes(q) || m.memberNumber.toLowerCase().includes(q);
      const matchesFilter = !showSelectedOnly || selected.has(m.id);
      if (matchesQuery && matchesFilter) ids.add(m.id);
    }
    return ids;
  }, [sorted, q, showSelectedOnly, selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          autoComplete="off"
          className="w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 sm:max-w-xs"
        />
        <label className="flex shrink-0 items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={showSelectedOnly}
            onChange={(event) => setShowSelectedOnly(event.target.checked)}
            className="h-4 w-4 rounded border-line accent-brand"
          />
          {showSelectedOnlyLabel}
        </label>
      </div>

      <p className="text-xs font-medium text-foreground/55">
        {selectedCountTemplate.replace("{count}", String(selected.size))}
      </p>

      <div className="max-h-72 overflow-y-auto rounded-2xl border border-line bg-white">
        {sorted.length === 0 || visibleIds.size === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-foreground/55">{noMatchesLabel}</p>
        ) : (
          <ul className="divide-y divide-line">
            {sorted.map((member) => (
              <li key={member.id} style={{ display: visibleIds.has(member.id) ? "block" : "none" }}>
                <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm transition hover:bg-brand/5">
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name={name}
                      value={member.id}
                      checked={selected.has(member.id)}
                      onChange={() => toggle(member.id)}
                      className="h-4 w-4 rounded border-line accent-brand"
                    />
                    <span>
                      {member.fullName}{" "}
                      <span className="font-mono text-xs text-foreground/50">{member.memberNumber}</span>
                    </span>
                  </span>
                  {member.status === "inactive" && (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-foreground/50">
                      {inactiveLabel}
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
