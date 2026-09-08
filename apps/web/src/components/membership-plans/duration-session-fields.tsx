"use client";

import { useState } from "react";

type DurationOption = { value: string; label: string };

export function DurationSessionFields({
  durationOptions,
  initialDurationDays,
  initialSessionCount,
  labels,
}: {
  durationOptions: DurationOption[];
  initialDurationDays?: number;
  initialSessionCount?: number;
  labels: {
    durationDaysLabel: string;
    forDurationPlansHint: string;
    selectPlaceholder: string;
    sessionCountLabel: string;
    forSessionPlansHint: string;
  };
}) {
  const [durationDays, setDurationDays] = useState(
    initialDurationDays ? String(initialDurationDays) : "",
  );
  const [sessionCount, setSessionCount] = useState(
    initialSessionCount ? String(initialSessionCount) : "",
  );

  // Duration and session count describe mutually exclusive plan types — only
  // one ever actually applies (see planType). Filling one clears the other
  // back to its placeholder so the form never looks like both are set.
  function handleDurationChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setDurationDays(e.target.value);
    if (e.target.value) setSessionCount("");
  }

  function handleSessionCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSessionCount(e.target.value);
    if (e.target.value) setDurationDays("");
  }

  return (
    <>
      <div className="grid gap-1.5">
        <label htmlFor="durationDays" className="text-sm font-medium">
          {labels.durationDaysLabel}{" "}
          <span className="text-foreground/40 font-normal">— {labels.forDurationPlansHint}</span>
        </label>
        <select
          id="durationDays"
          name="durationDays"
          value={durationDays}
          onChange={handleDurationChange}
          className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">{labels.selectPlaceholder}</option>
          {durationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="sessionCount" className="text-sm font-medium">
          {labels.sessionCountLabel}{" "}
          <span className="text-foreground/40 font-normal">— {labels.forSessionPlansHint}</span>
        </label>
        <input
          id="sessionCount"
          name="sessionCount"
          type="number"
          min="1"
          value={sessionCount}
          onChange={handleSessionCountChange}
          placeholder="e.g. 12"
          className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
    </>
  );
}
