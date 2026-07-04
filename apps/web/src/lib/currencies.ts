export type Currency = {
  /** ISO 4217 code (e.g. "ILS") */
  code: string;
  symbol: string;
  name: string;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  { code: "JOD", symbol: "JD", name: "Jordanian Dinar" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
];

export function getCurrencySymbol(code: string | undefined | null): string {
  if (!code) return "";
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
