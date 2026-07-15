/** Renders a phone number that always reads left-to-right (+countrycode
 * first), even inside RTL (Arabic/Hebrew) layouts — plain "+1234…" text has
 * no strong-direction characters, so without this it can get bidi-reordered
 * to "1234…+" inside an RTL ancestor. */
export function PhoneNumber({ value, className }: { value: string; className?: string }) {
  return (
    <span dir="ltr" className={className}>
      {value}
    </span>
  );
}
