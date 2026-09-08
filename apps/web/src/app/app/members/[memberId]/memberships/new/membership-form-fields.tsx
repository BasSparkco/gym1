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

type Locker = {
  id: string;
  lockerNumber: string;
  size: "small" | "medium" | "large" | null;
  monthlyPrice: number;
};

type DiscountType = {
  id: string;
  name: string;
};

function monthsForPlan(plan?: Plan) {
  return plan?.durationDays ? Math.max(1, Math.round(plan.durationDays / 30)) : 1;
}

export default function MembershipFormFields({
  plans,
  lockers,
  discountTypes,
  today,
  dateFormat,
  currencySymbol,
  labels,
}: {
  plans: Plan[];
  lockers: Locker[];
  discountTypes: DiscountType[];
  today: string;
  dateFormat: DateFormat;
  currencySymbol: string;
  labels: {
    membershipPlan: string;
    startDate: string;
    endDate: string;
    regularPrice: string;
    discountType: string;
    discountTypeNone: string;
    discountPercent: string;
    finalPrice: string;
    noPlansAvailable: string;
    createPlanFirst: string;
    rentLocker: string;
    selectLocker: string;
    noLockersAvailable: string;
    createLockerFirst: string;
    lockerFinalPrice: string;
  };
}) {
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [discountTypeId, setDiscountTypeId] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [rentLocker, setRentLocker] = useState(false);
  const [lockerId, setLockerId] = useState("");
  const [lockerPrice, setLockerPrice] = useState<number | "">("");

  const selectedPlan = plans.find((plan) => plan.id === planId);
  const selectedLocker = lockers.find((locker) => locker.id === lockerId);
  const computedEndDate =
    selectedPlan?.planType === "duration" && selectedPlan.durationDays
      ? addDaysToDateString(startDate, selectedPlan.durationDays)
      : "";

  const regularPrice = selectedPlan?.price ?? 0;
  const effectiveDiscountPercent = discountTypeId ? Number(discountPercent) || 0 : 0;
  const finalPrice = regularPrice - (regularPrice * effectiveDiscountPercent) / 100;

  function handlePlanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setPlanId(id);
    const plan = plans.find((p) => p.id === id);
    if (selectedLocker) setLockerPrice(selectedLocker.monthlyPrice * monthsForPlan(plan));
  }

  function handleDiscountTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setDiscountTypeId(e.target.value);
    if (!e.target.value) setDiscountPercent("");
  }

  function handleLockerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setLockerId(id);
    const locker = lockers.find((l) => l.id === id);
    if (locker) setLockerPrice(locker.monthlyPrice * monthsForPlan(selectedPlan));
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
                {plan.name} — {currencySymbol}{plan.price}
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
                {type.name}
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

      <div className="grid gap-1.5">
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={rentLocker}
            onChange={(e) => setRentLocker(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-brand"
          />
          <span className="font-medium">{labels.rentLocker}</span>
        </label>

        {rentLocker && (
          <div className="grid gap-4 rounded-2xl border border-line bg-white/50 p-4">
            {lockers.length === 0 ? (
              <p className="text-sm text-foreground/50">
                {labels.noLockersAvailable}{" "}
                <a href="/app/lockers/new" className="text-brand hover:underline">
                  {labels.createLockerFirst}
                </a>
              </p>
            ) : (
              <>
                <div className="grid gap-1.5">
                  <label htmlFor="lockerId" className="text-sm font-medium">
                    {labels.selectLocker} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="lockerId"
                    name="lockerId"
                    required
                    value={lockerId}
                    onChange={handleLockerChange}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="">Select a locker…</option>
                    {lockers.map((locker) => (
                      <option key={locker.id} value={locker.id}>
                        #{locker.lockerNumber} — {currencySymbol}
                        {locker.monthlyPrice}
                        {locker.size ? ` · ${locker.size}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="lockerFinalPrice" className="text-sm font-medium">
                    {labels.lockerFinalPrice}
                  </label>
                  <input
                    id="lockerFinalPrice"
                    name="lockerFinalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={lockerPrice}
                    onChange={(e) => setLockerPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
