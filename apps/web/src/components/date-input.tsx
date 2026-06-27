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
}

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function DateInput({ name, defaultValue, dateFormat, required, id }: DateInputProps) {
  const initial: PickerValue = defaultValue ? new Date(defaultValue + "T12:00:00") : null;
  const [value, setValue] = useState<PickerValue>(initial);

  // App stores "dd/mm/yyyy" or "mm/dd/yyyy" (lowercase mm = month)
  // react-date-picker uses uppercase MM for month
  const format = dateFormat === "dd/mm/yyyy" ? "dd/MM/yyyy" : "MM/dd/yyyy";

  return (
    <div className="date-input-wrapper">
      <DatePicker
        id={id}
        onChange={(v) => setValue(v as PickerValue)}
        value={value}
        format={format}
        required={required}
        clearIcon={null}
        calendarProps={{ className: "date-input-calendar" }}
      />
      <input type="hidden" name={name} value={value ? toYMD(value) : ""} />
    </div>
  );
}
