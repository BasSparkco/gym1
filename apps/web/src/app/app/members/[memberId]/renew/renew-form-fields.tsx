"use client";

import { useState } from "react";
import DateInput from "@/components/date-input";
import type { DateFormat } from "@/lib/settings";
import type { Lang } from "@/lib/i18n";
import { formatDict } from "@/lib/format-dict";
import { localizedDiscountTypeName } from "@/lib/discount-type-utils";

type Plan = {
  id: string;
  name: string;
  price: number;
  planType: "duration" | "session";
  durationDays?: number;
  sessionCount?: number;
};

type DiscountType = {
  id: string;
  name: string;
  nameAr: string | null;
  nameHe: string | null;
  defaultPercent: number;
};

export default function RenewFormFields({
  plans,
  discountTypes,
  lang,
  initialPlanId,
  dateFormat,
  defaultStartDate,
  currencySymbol,
  labels,
}: {
  plans: Plan[];
  discountTypes: DiscountType[];
  lang: Lang;
  initialPlanId: string;
  dateFormat: DateFormat;
  defaultStartDate: string;
  currencySymbol: string;
  labels: {
    plan: string;
    startDate: string;
    regularPrice: string;
    discountType: string;
    discountTypeNone: string;
    discountPercent: string;
    finalPrice: string;
    noPlansAvailable: string;
    daysUnit: string;
    sessionsUnit: string;
  };
}) {
  function planDurationLabel(plan: Plan): string {
    if (plan.planType === "duration") {
      const count = plan.durationDays ?? 0;
      return formatDict(labels.daysUnit, { count, plural: count === 1 ? "" : "s" });
    }
    const count = plan.sessionCount ?? 0;
    return formatDict(labels.sessionsUnit, { count, plural: count === 1 ? "" : "s" });
  }

  const [planId, setPlanId] = useState(initialPlanId);
  const [discountTypeId, setDiscountTypeId] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number | "">("");

  const selectedPlan = plans.find((plan) => plan.id === planId);
  const regularPrice = selectedPlan?.price ?? 0;
  const effectiveDiscountPercent = discountTypeId ? Number(discountPercent) || 0 : 0;
  const finalPrice = regularPrice - (regularPrice * effectiveDiscountPercent) / 100;

  function handlePlanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPlanId(e.target.value);
  }

  function handleDiscountTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setDiscountTypeId(id);
    const type = discountTypes.find((t) => t.id === id);
    setDiscountPercent(type ? type.defaultPercent : "");
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
                {plan.name} — {currencySymbol}{plan.price} · {planDurationLabel(plan)}
              </option>
            ))}
          </select>
        )}
      </div>

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
        <label className="text-sm font-medium">{labels.regularPrice}</label>
        <p className="rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground/70">
          {currencySymbol}
          {regularPrice}
        </p>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="discountTypeId" className="text-sm font-medium">
            {labels.discountType}
          </label>
          <select
            id="discountTypeId"
            name="discountTypeId"
            value={discountTypeId}
            onChange={handleDiscountTypeChange}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">{labels.discountTypeNone}</option>
            {discountTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {localizedDiscountTypeName(type, lang)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="discountPercent" className="text-sm font-medium">
            {labels.discountPercent}
          </label>
          <input
            id="discountPercent"
            name="discountPercent"
            type="number"
            min="0"
            max="100"
            step="0.01"
            disabled={!discountTypeId}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-line/20 disabled:text-foreground/40"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium">{labels.finalPrice}</label>
        <p className="rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm font-semibold text-foreground">
          {currencySymbol}
          {finalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      </div>
    </>
  );
}
