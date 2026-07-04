"use client";

import { useState } from "react";
import DateInput from "@/components/date-input";
import { addDaysToDateString, formatDate } from "@/lib/date-format";
import type { DateFormat } from "@/lib/settings";

type Plan = {
  id: string;
  name: string;
  price: number;
  planType: "duration" | "session";
  durationDays?: number;
  sessionCount?: number;
};

export default function MembershipFormFields({
  plans,
  today,
  dateFormat,
  labels,
}: {
  plans: Plan[];
  today: string;
  dateFormat: DateFormat;
  labels: {
    membershipPlan: string;
    startDate: string;
    endDate: string;
    finalPrice: string;
    noPlansAvailable: string;
    createPlanFirst: string;
  };
}) {
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [price, setPrice] = useState<number | "">("");

  const selectedPlan = plans.find((plan) => plan.id === planId);
  const computedEndDate =
    selectedPlan?.planType === "duration" && selectedPlan.durationDays
      ? addDaysToDateString(startDate, selectedPlan.durationDays)
      : "";

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
          {labels.membershipPlan} <span className="text-red-500">*</span>
        </label>
        {plans.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground/50">
            {labels.noPlansAvailable}{" "}
            <a href="/app/membership-plans/new" className="text-brand hover:underline">
              {labels.createPlanFirst}
            </a>
          </p>
        ) : (
          <select
            id="planId"
            name="planId"
            required
            value={planId}
            onChange={handlePlanChange}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Select a plan…</option>
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
            {labels.startDate} <span className="text-red-500">*</span>
          </label>
          <DateInput
            id="startDate"
            name="startDate"
            dateFormat={dateFormat}
            defaultValue={today}
            required
            onChange={(value) => setStartDate(value || today)}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="endDate" className="text-sm font-medium">
            {labels.endDate}{" "}
            <span className="text-foreground/40 font-normal">— auto-calculated for duration plans</span>
          </label>
          {computedEndDate ? (
            <>
              <p className="rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground/60">
                {formatDate(computedEndDate, dateFormat)}
              </p>
              <input type="hidden" name="endDate" value={computedEndDate} />
            </>
          ) : (
            <DateInput id="endDate" name="endDate" dateFormat={dateFormat} />
          )}
        </div>
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
          placeholder="e.g. 120"
          value={price}
          onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
    </>
  );
}
