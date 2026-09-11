"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import type { Area } from "@/lib/areas";
import type { Dict } from "@/lib/i18n";

const ADD_NEW = "__add_new_area__";

const inputCls =
  "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

type Props = {
  id?: string;
  name: string;
  options: Area[];
  /** Controlled selected areaId. Falls back to internal state (initialized
   * from `defaultValue`) when omitted, same as a plain <select>. */
  value?: string;
  defaultValue?: string;
  onChange?: (areaId: string) => void;
  createArea: (name: string) => Promise<Area>;
  t: Dict;
  className?: string;
};

/** Area picker for member forms: a plain <select> plus an "add new" entry
 * that opens a popup to create an area inline (via a server action) and
 * immediately selects it — same shape as the home-branch select, so staff
 * don't need to leave the member form to add an area first. */
export default function AreaCombobox({
  id,
  name,
  options: initialOptions,
  value,
  defaultValue = "",
  onChange,
  createArea,
  t,
  className,
}: Props) {
  const [options, setOptions] = useState(initialOptions);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selected = value ?? internalValue;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function select(areaId: string) {
    if (value === undefined) setInternalValue(areaId);
    onChange?.(areaId);
  }

  function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (next === ADD_NEW) {
      setNewName("");
      setError(null);
      setDialogOpen(true);
      return;
    }
    select(next);
  }

  async function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    setError(null);
    try {
      const area = await createArea(trimmed);
      setOptions((prev) => (prev.some((a) => a.id === area.id) ? prev : [...prev, area]));
      select(area.id);
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <select
        id={id}
        name={name}
        value={selected}
        onChange={handleSelectChange}
        className={cn(
          "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
          className,
        )}
      >
        <option value="">—</option>
        {[...options]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        <option value={ADD_NEW}>{t.members.addNewArea}</option>
      </select>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={t.members.addNewArea.replace(/^\+\s*/, "")}>
        <form onSubmit={handleCreateSubmit} className="grid gap-4 px-5 py-5">
          <div className="grid gap-1.5">
            <label htmlFor="new-area-name" className="text-sm font-medium">
              {t.members.areaName}
            </label>
            <input
              id="new-area-name"
              autoFocus
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="e.g. Jerusalem"
              className={inputCls}
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              {t.actions.cancel}
            </Button>
            <Button type="submit" variant="primary" disabled={creating || !newName.trim()}>
              {creating ? t.actions.saving : t.actions.create}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
