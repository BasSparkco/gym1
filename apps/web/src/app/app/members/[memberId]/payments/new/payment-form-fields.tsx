"use client";

import { useState } from "react";

export type DebtItem = {
  key: string;
  kind: "membership" | "course" | "locker";
  label: string;
  statusLabel: string;
  /** Original charge amount (what the item cost when sold). */
  amount: number;
  /** Amount still outstanding for this item after netting prior payments
   * against the member's charges oldest-first — this is what gets summed
   * into the Amount field, not the gross `amount`. */
  remaining: number;
  membershipId?: string;
};

export default function PaymentFormFields({
  items,
  debt,
  currencySymbol,
  labels,
}: {
  items: DebtItem[];
  debt: number;
  currencySymbol: string;
  labels: {
    paidFor: string;
    allDebts: string;
    noDebtItems: string;
    amount: string;
    paidOfTotal: string;
  };
}) {
  const [allDebts, setAllDebts] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState<number | "">("");

  function sumSelected(keys: Set<string>) {
    return items
      .filter((item) => keys.has(item.key))
      .reduce((sum, item) => sum + item.remaining, 0);
  }

  function toggleAllDebts() {
    const next = !allDebts;
    setAllDebts(next);
    setSelectedKeys(new Set());
    setAmount(next ? debt : 0);
  }

  function toggleItem(key: string) {
    setAllDebts(false);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setAmount(sumSelected(next));
      return next;
    });
  }

  const selectedMembershipId = items.find(
    (item) => item.kind === "membership" && selectedKeys.has(item.key),
  )?.membershipId;

  return (
    <div className="grid gap-1.5">
      <input type="hidden" name="membershipId" value={selectedMembershipId ?? ""} />

      <label className="text-sm font-medium">{labels.paidFor}</label>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground/50">
          {labels.noDebtItems}
        </p>
      ) : (
        <div className="grid gap-2 rounded-2xl border border-line bg-white p-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-foreground/[0.03]">
            <input
              type="checkbox"
              checked={allDebts}
              onChange={toggleAllDebts}
              className="h-4 w-4 rounded border-line accent-brand"
            />
            <span className="font-medium">{labels.allDebts}</span>
            <span className="ms-auto font-mono text-foreground/60">
              {currencySymbol}
              {debt.toLocaleString()}
            </span>
          </label>

          {items.map((item) => {
            const paidTowards = item.amount - item.remaining;
            return (
              <label
                key={item.key}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-foreground/[0.03]"
              >
                <input
                  type="checkbox"
                  checked={!allDebts && selectedKeys.has(item.key)}
                  onChange={() => toggleItem(item.key)}
                  className="h-4 w-4 rounded border-line accent-brand"
                />
                <span>{item.label}</span>
                <span className="text-xs text-foreground/40">{item.statusLabel}</span>
                <span className="ms-auto text-end">
                  <span className="block font-mono text-foreground/60">
                    {currencySymbol}
                    {item.remaining.toLocaleString()}
                  </span>
                  {paidTowards > 0 && (
                    <span className="block text-[11px] text-foreground/40">
                      {labels.paidOfTotal
                        .replace("{paid}", `${currencySymbol}${paidTowards.toLocaleString()}`)
                        .replace("{total}", `${currencySymbol}${item.amount.toLocaleString()}`)}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <label htmlFor="amount" className="mt-2 text-sm font-medium">
        {labels.amount} <span className="text-red-500">*</span>
      </label>
      <input
        id="amount"
        name="amount"
        type="number"
        min="0.01"
        step="0.01"
        required
        placeholder="e.g. 120"
        value={amount}
        onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
        className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
