# Currencies — Phase 1 Implementation Plan

Source design: `Currencies Design.md`. This plan scopes down that document to what
this codebase actually needs today, while keeping the schema open for the rest
of the design (exchange rates, multi-currency transactions) to land later
without a redesign.

## PM recommendation (why this scope)

The full design doc models a mature multi-currency ERP: three stored amounts
per transaction, two frozen exchange rates, a `currencies` table, and a
scheduled FX-rate sync job. Today this app has **one implicit currency**,
hardcoded as a literal `$` in ~12 places across the web app, and a single
gym tenant (branches in Ramallah/Nablus — West Bank, so ILS is the real
currency, not USD). Building the full spec now means shipping FX-rate sync
and dual-rate transaction storage for a case (a member paying in a currency
different from their branch's) that doesn't happen yet.

**Phase 1** (this plan): make currency a first-class, per-branch/per-company
setting and fix the hardcoded `$` bug. No conversion, no exchange rates, no
new `currencies` table.

**Phase 2** (future, only if a real multi-currency customer shows up):
`original_amount`/`branch_amount`/`company_amount` + frozen rates on
`Payment`, a real `currencies`/`exchange_rates` table, scheduled FX sync job.

## Deviations from the design doc (deliberate)

- **No dedicated `currencies` DB table.** This codebase already has a
  precedent for small reference lists: `Branch.countryCode` is a plain
  `String` with only a client-side `COUNTRIES` array
  (`apps/web/src/lib/countries.ts`) constraining the UI (no FK, no
  server-side whitelist). Currency uses a plain `String` column the same
  way, but *does* get a server-side whitelist (`apps/api/src/common/currencies.ts`)
  — unlike `countryCode`, an invalid currency code isn't just cosmetic, it
  throws a `RangeError` out of `Intl.NumberFormat`/`Intl.NumberFormat`-backed
  formatting at report-render time, so it's validated at the API boundary.
  If Phase 2 ever needs `exchange_rates` FKs, a real table can be introduced
  then — nothing here blocks that.
- **Reporting currency lives on `TenantSettings`, not a bare column on
  `Tenant`.** `Tenant` today has no update path at all (it's system-managed);
  `TenantSettings` is where every other tenant-level preference
  (`dateFormat`, `ownerDataScope`, etc.) already lives, with an existing
  service/controller/UI pattern to extend.
- **Every "current price/amount" screen uses the current session's active
  branch currency**, not a per-row branch lookup. Since there's no
  conversion layer yet, a single mental model ("the currency of the branch
  you're working in") is simpler and correct for the common case (one
  branch, or multiple branches sharing a currency). The one place this is
  genuinely ambiguous — the owner's "all branches" report view, once branches
  have *different* currencies — falls back to the tenant's reporting
  currency. This is a known, documented approximation until Phase 2.

## Schema changes

- `Branch.operatingCurrencyCode String @default("ILS")`
- `TenantSettings.reportingCurrencyCode String @default("ILS")`

Default `ILS` matches the real branches (Ramallah, Nablus). Both are plain
strings (no enum, no FK) — adding a new supported currency later is a code
change to the static list, not a migration.

## Backend (`apps/api`)

- `branches.service.ts` / `branches.controller.ts`: thread
  `operatingCurrencyCode` through create/update, same as `countryCode`
  (trim/uppercase, no server-side whitelist).
- `settings-store.ts` / `settings.service.ts` / `settings.controller.ts`:
  add `reportingCurrencyCode`, gated to `owner` role on change (financial
  setting, same gate as `ownerDataScope`).
- `data-scope.service.ts`: new `resolveCurrencyCode(user, branchId)` —
  branch's `operatingCurrencyCode` when scoped to one branch, else the
  tenant's `reportingCurrencyCode`.
- `reports.service.ts`: use `resolveCurrencyCode` for the dashboard's
  `formatCurrency` (currently hardcoded `currency: 'USD'`) and add a
  `currency` field to the payments / active-memberships / expired-memberships
  report payloads.

## Frontend (`apps/web`)

- `lib/currencies.ts` (new): static list — USD, EUR, ILS, JOD, SAR, AED, EGP
  (the design doc's own table) — with `getCurrencySymbol(code)`.
- `lib/currency.ts` (new): `getActiveCurrencySymbol(branchId?)` — branch's
  currency if given, else the tenant's reporting currency. Used by every
  non-report money display.
- `lib/branches.ts`, `lib/settings.ts`, `lib/reports.ts`: add the new fields
  to the existing types (no shape changes beyond that — the API already
  returns full rows).
- Branch new/edit/detail pages: currency `<select>`, mirroring the existing
  country select.
- Settings → Options page: "Reporting Currency" select, owner-only section.
- Replace every hardcoded `$`:
  - `reports/payments`, `reports/active-memberships`,
    `reports/expired-memberships` → `getCurrencySymbol(report.currency)`
  - `membership-plans` list/detail, `members/[id]` (memberships + payments
    lists), `members/[id]/payments/new`, `members/[id]/memberships/new`
    (`membership-form-fields.tsx`), `members/[id]/renew`
    (`renew-form-fields.tsx`) → `getActiveCurrencySymbol(session.branch.id)`
  - Employee salary display (`employees/[id]`) → same helper, since salary is
    explicitly a branch-operating-currency figure per the design doc.

## Out of scope for Phase 1 (explicitly deferred)

- Transaction-level original/branch/company amounts and frozen exchange
  rates.
- Exchange rate provider integration + scheduled sync job.
- Per-row currency in the owner's cross-branch aggregate reports when
  branches don't share a currency (rare today; revisit if it happens).
