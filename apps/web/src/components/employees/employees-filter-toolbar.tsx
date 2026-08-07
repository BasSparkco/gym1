"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Branch } from "@/lib/branches";
import type { Dict } from "@/lib/i18n";

type Props = {
  branches: Branch[];
  positions: string[];
  t: Dict;
  showBranchFilter: boolean;
};

export function EmployeesFilterToolbar({ branches, positions, t, showBranchFilter }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [syncedUrlQ, setSyncedUrlQ] = useState(urlQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (urlQ !== syncedUrlQ) {
    setSyncedUrlQ(urlQ);
    setQ(urlQ);
  }

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  function onSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value || undefined });
    }, 350);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-[18px] border border-line bg-surface px-6 py-5">
      <label className="grid flex-1 gap-1 text-sm" style={{ minWidth: 220 }}>
        <span className="text-xs font-medium text-foreground/60">{t.employees.searchPlaceholder}</span>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" strokeWidth={2} />
          <input
            type="text"
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.employees.searchPlaceholder}
            className="w-full rounded-[10px] border border-line bg-white py-2 ps-9 pe-4 text-sm outline-none focus:border-brand"
          />
        </div>
      </label>

      {showBranchFilter && (
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-foreground/60">{t.employees.branch}</span>
          <select
            value={searchParams.get("branch") ?? ""}
            onChange={(e) => updateParams({ branch: e.target.value || undefined })}
            className="rounded-[10px] border border-line bg-white px-4 py-2 text-sm"
          >
            <option value="">{t.employees.filterAllBranches}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="grid gap-1 text-sm">
        <span className="text-xs font-medium text-foreground/60">{t.employees.job}</span>
        <select
          value={searchParams.get("job") ?? ""}
          onChange={(e) => updateParams({ job: e.target.value || undefined })}
          className="rounded-[10px] border border-line bg-white px-4 py-2 text-sm"
        >
          <option value="">{t.employees.filterAllPositions}</option>
          {positions.map((job) => (
            <option key={job} value={job}>
              {job}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
