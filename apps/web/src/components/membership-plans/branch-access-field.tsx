"use client";

import { useState } from "react";

type Branch = { id: string; name: string };

type BranchAccessMode = "all" | "home" | "selected";

export function BranchAccessField({
  branches,
  defaultMode,
  entitledBranchIds,
  labels,
}: {
  branches: Branch[];
  defaultMode: BranchAccessMode;
  entitledBranchIds: Set<string>;
  labels: {
    branchAccess: string;
    allBranches: string;
    homeBranchOnly: string;
    selectedBranchesOnly: string;
  };
}) {
  const [mode, setMode] = useState<BranchAccessMode>(defaultMode);

  return (
    <div className="grid gap-1.5 self-start">
      <label htmlFor="branchAccessMode" className="text-sm font-medium">
        {labels.branchAccess}
      </label>
      <select
        id="branchAccessMode"
        name="branchAccessMode"
        value={mode}
        onChange={(e) => setMode(e.target.value as BranchAccessMode)}
        className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      >
        <option value="all">{labels.allBranches}</option>
        <option value="home">{labels.homeBranchOnly}</option>
        <option value="selected">{labels.selectedBranchesOnly}</option>
      </select>
      {mode === "selected" && branches.length > 0 && (
        <div className="mt-1 grid gap-2 rounded-2xl border border-line bg-white px-4 py-3 sm:grid-cols-2">
          {branches.map((branch) => (
            <label key={branch.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="branchIds"
                value={branch.id}
                defaultChecked={entitledBranchIds.has(branch.id)}
                className="h-4 w-4 rounded border-line accent-brand"
              />
              <span>{branch.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
