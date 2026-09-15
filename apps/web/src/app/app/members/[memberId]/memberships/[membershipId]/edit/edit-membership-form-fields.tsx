"use client";

import { useState } from "react";
import { addDaysToDateString, formatDate } from "@/lib/date-format";
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

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function EditMembershipFormFields({
  plans,
  discountTypes,
  lang,
  startDate,
  dateFormat,
  currencySymbol,
  initialPlanId,
  initialDiscountTypeId,
  initialDiscountPercent,
  labels,
}: {
  plans: Plan[];
  discountTypes: DiscountType[];
  lang: Lang;
  startDate: string;
  dateFormat: DateFormat;
  currencySymbol: string;
  initialPlanId: string;
  initialDiscountTypeId: string;
  initialDiscountPercent: number | "";
  labels: {
    membershipPlan: string;
    newEndDate: string;
    regularPrice: string;
    discountType: string;
    discountTypeNone: string;
    discountPercent: string;
    finalPrice: string;
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

  const initialPlan = plans.find((plan) => plan.id === initialPlanId);
  const [planId, setPlanId] = useState(initialPlanId);
  const [discountTypeId, setDiscountTypeId] = useState(initialDiscountTypeId);
  const [discountPercent, setDiscountPercent] = useState<number | "">(initialDiscountPercent);
  const [finalPrice, setFinalPrice] = useState<number | "">(
    initialPlan
      ? round2(initialPlan.price - (initialPlan.price * (Number(initialDiscountPercent) || 0)) / 100)
      : 0,
  );

  const selectedPlan = plans.find((plan) => plan.id === planId);
  const regularPrice = selectedPlan?.price ?? 0;
  const computedEndDate =
    selectedPlan?.planType === "duration" && selectedPlan.durationDays
      ? addDaysToDateString(startDate, selectedPlan.durationDays)
      : "";

  function handlePlanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setPlanId(id);
    const plan = plans.find((p) => p.id === id);
    const newRegularPrice = plan?.price ?? 0;
    const percent = Number(discountPercent) || 0;
    setFinalPrice(round2(newRegularPrice - (newRegularPrice * percent) / 100));
  }

  function handleDiscountTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setDiscountTypeId(id);
    const type = discountTypes.find((t) => t.id === id);
    if (type) {
      setDiscountPercent(type.defaultPercent);
      setFinalPrice(round2(regularPrice - (regularPrice * type.defaultPercent) / 100));
    } else {
      setDiscountPercent("");
      setFinalPrice(regularPrice);
    }
  }

  function handleDiscountPercentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value === "" ? "" : Number(e.target.value);
    setDiscountPercent(value);
    const percent = value === "" ? 0 : value;
    setFinalPrice(round2(regularPrice - (regularPrice * percent) / 100));
  }

  function handleFinalPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value === "" ? "" : Number(e.target.value);
    setFinalPrice(value);
    if (regularPrice > 0) {
      const priceNum = value === "" ? 0 : value;
      const percent = Math.max(0, Math.min(100, round2(((regularPrice - priceNum) / regularPrice) * 100)));
      setDiscountPercent(percent);
    }
  }

  return (
    <>
      <div className="grid gap-1.5">
        <label htmlFor="planId" className="text-sm font-medium">
          {labels.membershipPlan} <span className="text-red-500">*</span>
        </label>
        <select
          id="planId"
          name="planId"
          required
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
      </div>

      {computedEndDate && (
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">{labels.newEndDate}</label>
          <p className="rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground/60">
            {formatDate(computedEndDate, dateFormat)}
          </p>
        </div>
      )}

      <div className="grid gap-1.5">
        <label className="text-sm font-bold text-brand">{labels.regularPrice}</label>
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
          <label htmlFor="discountPercent" className="text-sm font-bold text-danger">
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
            onChange={handleDiscountPercentChange}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-line/20 disabled:text-foreground/40"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="finalPrice" className="text-sm font-bold text-brand">
          {labels.finalPrice}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-sm text-foreground/60">
            {currencySymbol}
          </span>
          <input
            id="finalPrice"
            type="number"
            min="0"
            step="0.01"
            disabled={!discountTypeId}
            value={finalPrice}
            onChange={handleFinalPriceChange}
            className="w-full rounded-2xl border border-line bg-white py-3 pe-4 ps-8 text-sm font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-white/50 disabled:text-foreground/70"
          />
        </div>
      </div>
    </>
  );
}
