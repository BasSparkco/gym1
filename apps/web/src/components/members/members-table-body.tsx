"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MemberProfileView, type MemberProfileData } from "@/components/members/member-profile-view";
import { MemberEditForm } from "@/components/members/member-edit-form";
import { updateMemberAction } from "@/app/app/members/actions";
import type { Branch } from "@/lib/branches";
import type { Area } from "@/lib/areas";
import type { Employee } from "@/lib/employees";
import type { DateFormat } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";
import type { BadgeTone } from "@/components/ui/badge";
import { PencilLine } from "lucide-react";

export type { MembershipRow, PaymentRow, LockerRentalRow } from "@/components/members/member-profile-view";

export type MemberRow = MemberProfileData & {
  planBadge?: string;
  expiresText: string;
  expiryColorClass: string;
  statusTone: BadgeTone;
  statusLabelText: string;
};

type Props = {
  rows: MemberRow[];
  branches: Branch[];
  areas: Area[];
  employees: Employee[];
  dateFormat: DateFormat;
  t: Dict;
  showBranchColumn?: boolean;
};

// Columns beyond Member/Status are hidden below `sm` so the table never needs
// horizontal scrolling on a phone; they reappear once there's room for them.
const secondaryCellCls = "hidden py-3 pe-4 text-start sm:table-cell";

// Renders the members table; clicking a row expands the SAME MemberProfileView
// the dedicated /app/members/[memberId] page uses, directly underneath that
// row (so the response is immediately visible even far down a long list),
// rather than at the bottom of the whole table.
//
// `table-fixed` is what makes that safe on narrow screens: with the default
// auto layout, a wide expanded row would force every column — and the whole
// table — to grow to fit it, right back to the horizontal-scroll problem this
// was built to avoid. Fixed layout locks the table's width to the header
// row's column widths; the expanded row's content then wraps/shrinks to fit
// that width instead of stretching it.
export function MembersTableBody({ rows, branches, areas, employees, dateFormat, t, showBranchColumn = true }: Props) {
  const [expanded, setExpanded] = useState<{ id: string; mode: "profile" | "edit" } | null>(null);
  const expandedRowRef = useRef<HTMLTableRowElement | null>(null);
  const expandedPanelRef = useRef<HTMLDivElement | null>(null);

  // Bring a newly expanded row into view: without this, expanding a row near
  // the bottom of a long list opens its panel below the fold and the click
  // silently appears to do nothing. Scrolling the ROW (not just the panel)
  // into view keeps the member's name/photo visible alongside their details.
  // `scroll-mt-*` on the row (below) keeps it clear of the sticky/fixed app
  // header instead of scrolling to the literal top edge of the viewport.
  useEffect(() => {
    if (!expanded) return;

    expandedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // preventScroll: the row's own smooth scroll above already handles
    // positioning — without this, focusing an off-screen panel makes the
    // browser jump-scroll it into view too, fighting the smooth scroll.
    expandedPanelRef.current?.focus({ preventScroll: true });
  }, [expanded]);

  function toggleProfile(id: string) {
    setExpanded((prev) => (prev && prev.id === id && prev.mode === "profile" ? null : { id, mode: "profile" }));
  }

  function toggleEdit(id: string) {
    setExpanded((prev) => (prev && prev.id === id && prev.mode === "edit" ? null : { id, mode: "edit" }));
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b border-line text-start text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
            <th className="w-[60%] pb-3 pe-4 text-start sm:w-[30%]">{t.reports.memberCol}</th>
            <th className="hidden pb-3 pe-4 text-start sm:table-cell sm:w-[18%]">{t.reports.planCol}</th>
            {showBranchColumn && <th className="hidden pb-3 pe-4 text-start sm:table-cell sm:w-[14%]">{t.members.homeBranch}</th>}
            <th className="hidden pb-3 pe-4 text-start sm:table-cell sm:w-[13%]">{t.reports.expiresCol}</th>
            <th className="w-[22%] pb-3 pe-4 text-start sm:w-[12%]">{t.reports.statusCol}</th>
            <th className="hidden pb-3 pe-4 text-start sm:table-cell sm:w-[10%]">{t.members.debt}</th>
            <th className="w-[18%] pb-3 text-end sm:w-[88px]">{t.actions.details}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => {
            const isSelected = expanded?.id === row.member.id;
            const colSpan = showBranchColumn ? 7 : 6;

            return (
              <Fragment key={row.member.id}>
                <tr
                  ref={isSelected ? expandedRowRef : undefined}
                  className={`scroll-mt-20 cursor-pointer transition-colors hover:bg-black/[0.02] ${isSelected ? "bg-black/[0.03]" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleProfile(row.member.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleProfile(row.member.id);
                    }
                  }}
                >
                  <td className="py-3 pe-4 text-start">
                    <div className="flex min-w-0 items-center gap-3">
                      {row.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.photoUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-brand/10"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/20 to-brand/5 text-xs font-semibold text-brand ring-1 ring-brand/10">
                          {row.avatar}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold tracking-tight hover:text-brand">{row.member.fullName}</p>
                        <p className="truncate font-mono text-xs text-foreground/50">{row.member.memberNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className={secondaryCellCls}>
                    {row.planBadge ? (
                      <Badge tone="brand" className="max-w-full truncate">{row.planBadge}</Badge>
                    ) : (
                      <span className="text-xs text-foreground/40">{t.members.noMembershipsYet}</span>
                    )}
                  </td>
                  {showBranchColumn && <td className={`${secondaryCellCls} truncate text-foreground/70`}>{row.branchName}</td>}
                  <td className={`${secondaryCellCls} truncate font-mono text-xs ${row.expiryColorClass}`}>{row.expiresText}</td>
                  <td className="py-3 pe-4 text-start">
                    <Badge tone={row.statusTone}>{row.statusLabelText}</Badge>
                  </td>
                  <td className={`${secondaryCellCls} truncate font-mono text-xs ${row.member.debt > 0 ? "text-danger" : "text-foreground/70"}`}>
                    {row.currencySymbol}
                    {row.member.debt.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleEdit(row.member.id);
                        }}
                      >
                        {t.actions.edit}
                      </Button>
                    </div>
                  </td>
                </tr>

                {isSelected && (
                  <tr>
                    <td colSpan={colSpan} className="bg-surface-muted/40 px-2 py-6 sm:px-7" onClick={(event) => event.stopPropagation()}>
                      <div ref={expandedPanelRef} tabIndex={-1} className="min-w-0 rounded-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                        {expanded?.mode === "profile" ? (
                          <MemberProfileView data={row} t={t} dateFormat={dateFormat} onEditClick={() => toggleEdit(row.member.id)} />
                        ) : (
                          <MemberEditForm
                            member={row.member}
                            photoUrl={row.photoUrl}
                            branches={branches}
                            areas={areas}
                            employees={employees}
                            dateFormat={dateFormat}
                            t={t}
                            action={updateMemberAction}
                            submitIcon={<PencilLine className="h-4 w-4" strokeWidth={2} />}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
