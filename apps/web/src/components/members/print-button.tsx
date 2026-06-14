"use client";

type PrintButtonProps = { label: string };

export function PrintButton({ label }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full border border-line bg-white px-6 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand print:hidden"
    >
      {label}
    </button>
  );
}
