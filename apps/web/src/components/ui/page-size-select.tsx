"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export function PageSizeSelect({ value, label }: { value: number; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", e.target.value);
    params.delete("page");
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <label className="flex items-center gap-2 text-xs text-foreground/60">
      {label}
      <select
        value={value}
        onChange={onChange}
        className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}
