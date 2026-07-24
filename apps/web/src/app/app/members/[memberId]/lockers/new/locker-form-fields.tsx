"use client";

import { useState } from "react";
import DateInput from "@/components/date-input";
import { addDaysToDateString } from "@/lib/date-format";
import type { DateFormat } from "@/lib/settings";

type Locker = {
  id: string;
  lockerNumber: string;
  size: "small" | "medium" | "large" | null;
  monthlyPrice: number;
};

export default function LockerFormFields({
  lockers,
  today,
  dateFormat,
  currencySymbol,
  labels,
}: {
  lockers: Locker[];
  today: string;
  dateFormat: DateFormat;
  currencySymbol: string;
  labels: {
    selectLocker: string;
    startDate: string;
    endDate: string;
    finalPrice: string;
    noLockersAvailable: string;
    createLockerFirst: string;
  };
}) {
  const [startDate, setStartDate] = useState(today);
  const [price, setPrice] = useState<number | "">("");

  function handleLockerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const locker = lockers.find((l) => l.id === id);
    if (locker) setPrice(locker.monthlyPrice);
  }

  return (
    <>
      <div className="grid gap-1.5">
        <label htmlFor="lockerId" className="text-sm font-medium">
          {labels.selectLocker} <span className="text-red-500">*</span>
        </label>
        {lockers.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground/50">
            {labels.noLockersAvailable}{" "}
            <a href="/app/lockers/new" className="text-brand hover:underline">
              {labels.createLockerFirst}
            </a>
          </p>
        ) : (
          <select
            id="lockerId"
            name="lockerId"
            required
            onChange={handleLockerChange}
            defaultValue=""
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
            {labels.endDate} <span className="text-red-500">*</span>
          </label>
          <DateInput
            id="endDate"
            name="endDate"
            dateFormat={dateFormat}
            defaultValue={addDaysToDateString(startDate, 30)}
            key={startDate}
            required
          />
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
          placeholder="e.g. 30"
          value={price}
          onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
    </>
  );
}
