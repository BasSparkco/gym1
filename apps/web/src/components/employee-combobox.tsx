"use client";

import { useMemo, useState } from "react";

export type EmployeeOption = {
  id: string;
  fullName: string;
  employeeNumber: string;
};

type Props = {
  name: string;
  options: EmployeeOption[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
};

/** Searchable employee picker for server-action forms: the visible input
 * filters options client-side, while a hidden input submits the selected
 * employee id under `name` (empty string when nothing is selected).
 * `required` is enforced on the visible input, since hidden inputs are never
 * candidates for HTML constraint validation. */
export default function EmployeeCombobox({ name, options, defaultValue, placeholder, required }: Props) {
  const initial = options.find((o) => o.id === defaultValue);
  const [query, setQuery] = useState(initial ? labelFor(initial) : "");
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.fullName.toLowerCase().includes(q) ||
        o.employeeNumber.toLowerCase().includes(q),
    );
  }, [query, options]);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId} />
      <input
        // Hidden inputs are never candidates for constraint validation, so a
        // plain `required` on the hidden field would be silently ignored —
        // this mirrors that requirement onto the visible input via custom
        // validity instead, re-applied every render so a typed-but-unselected
        // value (selectedId cleared, query non-empty) still blocks submission.
        ref={(el) => {
          el?.setCustomValidity(required && !selectedId ? "Select an employee from the list." : "");
        }}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delayed so an option's onMouseDown can fire before the list closes.
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-line bg-white py-1 shadow-lg">
          {matches.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-start text-sm transition hover:bg-brand/5"
                onMouseDown={() => {
                  setSelectedId(option.id);
                  setQuery(labelFor(option));
                  setOpen(false);
                }}
              >
                {option.fullName}{" "}
                <span className="font-mono text-xs text-foreground/50">
                  {option.employeeNumber}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function labelFor(option: EmployeeOption) {
  return `${option.fullName} (${option.employeeNumber})`;
}
