"use client";

import { useState } from "react";
import type { Gate } from "@/lib/gates";
import type { GateAccessScope } from "@/lib/employee-attendance";
import type { Dict } from "@/lib/i18n";

const inputCls =
  "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

// Shared by the new-employee form and the employee profile's edit form —
// only shows the (org-wide) gate checklist once "selected gates" is chosen,
// since the branch/organization options don't need one.
export function GateAccessScopeField({
  gates,
  branchMap,
  defaultScope,
  defaultGateIds,
  t,
}: {
  gates: Gate[];
  branchMap: Record<string, string>;
  defaultScope: GateAccessScope;
  defaultGateIds: string[];
  t: Dict;
}) {
  const [scope, setScope] = useState<GateAccessScope>(defaultScope);
  const gatesSpanMultipleBranches = new Set(gates.map((g) => g.branchId)).size > 1;

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5 sm:max-w-xs">
        <select
          name="gateAccessScope"
          value={scope}
          onChange={(e) => setScope(e.target.value as GateAccessScope)}
          className={inputCls}
        >
          <option value="branch">{t.attendance.allGates}</option>
          <option value="organization">{t.attendance.allOrgGates}</option>
          <option value="selected">{t.attendance.selectedGatesOnly}</option>
        </select>
      </div>
      {scope === "selected" &&
        (gates.length === 0 ? (
          <p className="text-sm text-foreground/55">{t.attendance.noGatesYet}</p>
        ) : (
          <div className="grid gap-2 rounded-2xl border border-line bg-white px-4 py-3 sm:grid-cols-2">
            {gates.map((gate) => (
              <label key={gate.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="gateIds"
                  value={gate.id}
                  defaultChecked={defaultGateIds.includes(gate.id)}
                  className="h-4 w-4 rounded border-line accent-brand"
                />
                <span>
                  {gate.name}
                  {gatesSpanMultipleBranches && (
                    <span className="text-foreground/50"> — {branchMap[gate.branchId] ?? gate.branchId}</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        ))}
    </div>
  );
}
