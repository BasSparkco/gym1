"use client";

import { useState } from "react";
import {
  MemberAutocomplete,
  type MemberResult,
} from "@/components/members/member-autocomplete";

type Props = {
  searchPlaceholder: string;
  selectedLabel: string;
  clearLabel: string;
};

export function CheckInMemberPicker({
  searchPlaceholder,
  selectedLabel,
  clearLabel,
}: Props) {
  const [selected, setSelected] = useState<MemberResult | null>(null);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-brand/30 bg-brand/5 px-5 py-4">
        <input type="hidden" name="identifier" value={selected.memberNumber} />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-bold text-brand uppercase">
            {selected.fullName[0]}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand/70">
              {selectedLabel}
            </p>
            <p className="font-semibold">{selected.fullName}</p>
            <p className="font-mono text-xs text-foreground/50">
              {selected.memberNumber}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium transition hover:border-brand hover:text-brand"
        >
          {clearLabel}
        </button>
      </div>
    );
  }

  return (
    <MemberAutocomplete
      placeholder={searchPlaceholder}
      onSelect={setSelected}
      autoFocus
    />
  );
}
