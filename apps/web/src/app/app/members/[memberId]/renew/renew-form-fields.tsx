"use client";

import { useState } from "react";
import DateInput from "@/components/date-input";
import type { DateFormat } from "@/lib/settings";

type Plan = {
  id: string;
  name: string;
  price: number;
  planType: "duration" | "session";
  durationDays?: number;
  sessionCount?: number;
};

export default function RenewFormFields({
  plans,
  initialPlanId,
  initialPrice,
  dateFormat,
  defaultStartDate,
  labels,
}: {
  plans: Plan[];
  initialPlanId: string;
  initialPrice: number;
  dateFormat: DateFormat;
  defaultStartDate: string;
  labels: { plan: string; startDate: string; finalPrice: string; noPlansAvailable: string };
}) {
  const [planId, setPlanId] = useState(initialPlanId);
  const [price, setPrice] = useState<number | "">(initialPrice);

  function handlePlanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setPlanId(id);
    const plan = plans.find((p) => p.id === id);
    if (plan) setPrice(plan.price);
  }

  return (
    <>
      <div className="grid gap-1.5">
        <label htmlFor="planId" className="text-sm font-medium">
          {labels.plan}{" "}
          <span className="text-foreground/40 font-normal">
            — leave unchanged to renew with the same plan
          </span>
        </label>
        {plans.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground/50">
            {labels.noPlansAvailable}
          </p>
        ) : (
          <select
            id="planId"
            name="planId"
            value={planId}
            onChange={handlePlanChange}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — ${plan.price}
                {plan.planType === "duration"
                  ? ` · ${plan.durationDays}d`
                  : ` · ${plan.sessionCount} sessions`}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="startDate" className="text-sm font-medium">
            {labels.startDate}{" "}
            <span className="text-foreground/40 font-normal">
              — defaults to day after current end
            </span>
          </label>
          <DateInput id="startDate" name="startDate" dateFormat={dateFormat} defaultValue={defaultStartDate} />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="finalPrice" className="text-sm font-medium">
            {labels.finalPrice}
          </label>
          <input
            id="finalPrice"
            name="finalPrice"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>
    </>
  );
}
