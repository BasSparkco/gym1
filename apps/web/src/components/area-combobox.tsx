"use client";

import { useState } from "react";
import { cn } from "@/components/ui/cn";
import type { Area } from "@/lib/areas";
import type { Dict } from "@/lib/i18n";

type Props = {
  id?: string;
  name: string;
  options: Area[];
  /** Controlled text value (the area's display name, not its id). Falls back
   * to internal state (initialized from `defaultValue`) when omitted, same
   * as EmployeeCombobox. */
  value?: string;
  defaultValue?: string;
  onChange?: (text: string) => void;
  t: Dict;
  className?: string;
};

/** Area picker for member forms: a free-text input that filters the tenant's
 * area list as the user types (case-insensitive substring match), same shape
 * as EmployeeCombobox. Typing a name that isn't in the list is allowed — the
 * text is kept as-is, never cleared, and submits via the `areaText` hidden
 * field alongside `name` (which only carries an id when the text exactly
 * matches an existing area). The member create/update handler resolves the
 * final areaId on submit, creating the area first if it doesn't exist yet. */
export default function AreaCombobox({ id, name, options, value, defaultValue = "", onChange, t, className }: Props) {
  const [internalText, setInternalText] = useState(defaultValue);
  const text = value ?? internalText;
  const [open, setOpen] = useState(false);

  function setText(next: string) {
    if (value === undefined) setInternalText(next);
    onChange?.(next);
  }

  const query = text.trim().toLowerCase();
  const matches = (
    query ? options.filter((area) => area.name.toLowerCase().includes(query)) : options
  )
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const matchedId = options.find((area) => area.name.trim().toLowerCase() === query)?.id ?? "";

  return (
    <div className="relative">
      <input type="hidden" name={name} value={matchedId} />
      <input type="hidden" name="areaText" value={text.trim()} />
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delayed so an option's onMouseDown can fire before the list closes.
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder={t.members.area}
        className={cn(
          "w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
          className,
        )}
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-line bg-white py-1 shadow-lg">
          {matches.map((area) => (
            <li key={area.id}>
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-start text-sm transition hover:bg-brand/5"
                onMouseDown={() => {
                  setText(area.name);
                  setOpen(false);
                }}
              >
                {area.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
