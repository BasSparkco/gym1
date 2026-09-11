"use client";

import { useRef, useState } from "react";
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
 * final areaId on submit, creating the area first if it doesn't exist yet.
 * ArrowDown from the input moves focus into the list (starting at the first
 * result); ArrowUp/ArrowDown then move between results, ArrowUp off the top
 * returns focus to the input, and Escape closes the list from either. */
export default function AreaCombobox({ id, name, options, value, defaultValue = "", onChange, t, className }: Props) {
  const [internalText, setInternalText] = useState(defaultValue);
  const text = value ?? internalText;
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Closing the list moves focus back to the input, which would otherwise
  // re-trigger onFocus's setOpen(true) and pop the list right back open —
  // this flag tells the next onFocus to skip that.
  const suppressReopenRef = useRef(false);

  function closeAndRefocus() {
    setOpen(false);
    suppressReopenRef.current = true;
    inputRef.current?.focus();
  }

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

  function selectOption(area: Area) {
    setText(area.name);
    closeAndRefocus();
  }

  function focusItem(index: number) {
    itemRefs.current[index]?.focus();
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        // Only close when focus leaves the whole combobox (input + list),
        // not when it moves between the input and a result button.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <input type="hidden" name={name} value={matchedId} />
      <input type="hidden" name="areaText" value={text.trim()} />
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="off"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (suppressReopenRef.current) {
            suppressReopenRef.current = false;
            return;
          }
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && matches.length > 0) {
            event.preventDefault();
            setOpen(true);
            focusItem(0);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={t.members.area}
        className={cn(
          "w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
          className,
        )}
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-line bg-white py-1 shadow-lg">
          {matches.map((area, index) => (
            <li key={area.id}>
              <button
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                className="block w-full px-4 py-2.5 text-start text-sm outline-none transition hover:bg-brand/5 focus:bg-brand/5"
                onClick={() => selectOption(area)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    focusItem(Math.min(index + 1, matches.length - 1));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    if (index === 0) {
                      inputRef.current?.focus();
                    } else {
                      focusItem(index - 1);
                    }
                  } else if (event.key === "Escape") {
                    closeAndRefocus();
                  }
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
