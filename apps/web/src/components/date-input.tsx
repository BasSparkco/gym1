"use client";

import { useState } from "react";
import DatePicker from "react-date-picker";
import type { DateFormat } from "@/lib/settings";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";

type PickerValue = Date | null;

interface DateInputProps {
  name: string;
  defaultValue?: string | null;
  dateFormat: DateFormat;
  required?: boolean;
  id?: string;
  onChange?: (value: string) => void;
  invalidLabel?: string;
}

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Catches typos like a 5-digit year ("20026") that react-date-picker's
// segment inputs don't reject on their own — those used to reach the API
// as a valid-looking Date object and only blow up later when read back.
function isOutOfRange(date: Date): boolean {
  const year = date.getFullYear();
  return year < MIN_YEAR || year > MAX_YEAR;
}

export default function DateInput({ name, defaultValue, dateFormat, required, id, onChange, invalidLabel }: DateInputProps) {
  const initial: PickerValue = defaultValue ? new Date(defaultValue + "T12:00:00") : null;
  const [value, setValue] = useState<PickerValue>(initial);
  const invalid = value !== null && isOutOfRange(value);

  // App stores "dd/mm/yyyy" or "mm/dd/yyyy" (lowercase mm = month)
  // react-date-picker uses uppercase MM for month
  const format = dateFormat === "dd/mm/yyyy" ? "dd/MM/yyyy" : "MM/dd/yyyy";

  return (
    <div className={`date-input-wrapper${invalid ? " date-input-invalid" : ""}`}>
      <DatePicker
        id={id}
        onChange={(v) => {
          setValue(v as PickerValue);
          onChange?.(v ? toYMD(v as Date) : "");
        }}
        value={value}
        format={format}
        required={required}
        clearIcon={null}
        calendarProps={{ className: "date-input-calendar" }}
        aria-invalid={invalid}
      />
      <input type="hidden" name={name} value={value ? toYMD(value) : ""} />
      {invalid && <p className="date-input-error">{invalidLabel ?? "Invalid date"}</p>}
    </div>
  );
}
