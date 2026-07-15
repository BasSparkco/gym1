type ClassValue = string | number | null | undefined | false | ClassValue[];

function flatten(value: ClassValue, out: string[]) {
  if (!value && value !== 0) return;
  if (Array.isArray(value)) {
    for (const item of value) flatten(item, out);
    return;
  }
  out.push(String(value));
}

export function cn(...values: ClassValue[]) {
  const out: string[] = [];
  flatten(values, out);
  return out.join(" ");
}
