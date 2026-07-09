# Currencies Design

## Purpose

This document defines the currency architecture for all SparkCo SaaS applications.

The objective is to build a flexible financial foundation that supports:

* Gym Management
* POS
* Accounting
* E-Commerce
* Future SaaS Products

The design must support:

* Multiple companies
* Multiple branches
* Multiple countries
* Multiple currencies
* Future accounting modules
* Future ERP features

without requiring database redesign.

---

# Financial Model

The system defines three different currency levels.

## 1. Company Reporting Currency

Each company has exactly one reporting currency.

This currency is used to generate company-wide financial reports across all branches.

Examples:

* Profit & Loss
* Revenue
* Expenses
* Financial Statements
* Executive Reports

Example:

```text
Spark Fitness

Reporting Currency:
USD
```

---

## 2. Branch Operating Currency

Each branch has exactly one operating currency.

This is the currency normally used for:

* Membership payments
* Product sales
* Expenses
* Salaries
* Cash drawers
* Daily operations

Example:

```text
Spark Fitness

Tel Aviv Branch
Operating Currency:
ILS

Amman Branch
Operating Currency:
JOD

Dubai Branch
Operating Currency:
AED
```

Each branch generates its own financial reports using its operating currency.

---

## 3. Transaction Currency

Every financial transaction may be performed using any currency.

Examples:

* Member pays in USD
* Customer pays in EUR
* Supplier is paid in GBP

The transaction currency is always preserved.

It must never be replaced by a converted value.

---

# Currency Flow

Example:

Company Reporting Currency

```text
USD
```

Branch Operating Currency

```text
ILS
```

Customer Payment

```text
100 EUR
```

Exchange Rates

```text
1 EUR = 4.20 ILS

1 EUR = 1.17 USD
```

Stored Transaction

```text
Original Amount:
100 EUR

Branch Amount:
420 ILS

Company Amount:
117 USD
```

This allows reporting at every required level.

---

# Company Settings

Each company stores:

```text
Company

Reporting Currency
```

The reporting currency is selected during company setup.

Changing the reporting currency after financial transactions exist is strongly discouraged.

A future migration process may be implemented if this feature becomes necessary.

---

# Branch Settings

Each branch stores:

```text
Branch

Operating Currency
```

The operating currency is selected during branch creation.

The operating currency may only be changed before any financial transaction exists.

Once financial records exist, the operating currency becomes immutable.

Reason:

Changing the operating currency would invalidate:

* Historical balances
* Branch reports
* Stored converted amounts
* Accounting records

---

# Currency Table

A dedicated currency table must exist.

Suggested fields:

```text
currencies

id
code
symbol
name
decimal_places
is_active
created_at
updated_at
```

Example data:

| Code | Symbol | Currency        |
| ---- | ------ | --------------- |
| USD  | $      | US Dollar       |
| EUR  | €      | Euro            |
| ILS  | ₪      | Israeli Shekel  |
| JOD  | JD     | Jordanian Dinar |
| SAR  | ﷼      | Saudi Riyal     |
| AED  | د.إ    | UAE Dirham      |
| EGP  | E£     | Egyptian Pound  |

Currencies should be seeded during installation.

---

# Exchange Rates

Exchange rates should be maintained automatically.

A scheduled background job should periodically retrieve the latest exchange rates from a trusted external provider.

Possible providers:

* European Central Bank (ECB)
* Frankfurter API
* ExchangeRate.host
* Open Exchange Rates
* Other supported providers

Exchange rates should be stored locally inside the database.

Suggested table:

```text
exchange_rates

id

from_currency_id

to_currency_id

rate

provider

effective_date

created_at
```

The application should use the locally stored rates instead of calling external APIs during financial transactions.

---

# Financial Transactions

Every transaction stores three monetary values.

## Original Transaction

The exact payment made by the customer.

Example:

```text
100 EUR
```

Fields:

```text
original_amount

original_currency_id
```

---

## Branch Amount

The converted amount using the branch operating currency.

Fields:

```text
branch_amount

branch_currency_id
```

---

## Company Amount

The converted amount using the company reporting currency.

Fields:

```text
company_amount

company_currency_id
```

---

# Exchange Rates Used

Every transaction must permanently store the exchange rates used during conversion.

Example:

```text
rate_to_branch

rate_to_company
```

Historical exchange rates must never change.

Future exchange rate updates must never modify existing transactions.

---

# Example Transaction

Company Reporting Currency

```text
USD
```

Branch Operating Currency

```text
ILS
```

Customer Payment

```text
100 EUR
```

Exchange Rates

```text
EUR → ILS = 4.20

EUR → USD = 1.17
```

Stored Values

```text
Original

100 EUR

Branch

420 ILS

Company

117 USD
```

---

# Reporting

Branch reports always use:

```text
Branch Operating Currency
```

Company reports always use:

```text
Company Reporting Currency
```

Original transaction reports may also be generated.

Example:

```text
Payments Today

USD

250

EUR

180

ILS

1,450
```

---

# Database Recommendations

Money values must never use floating-point data types.

Do NOT use:

* FLOAT
* DOUBLE

Use:

```text
NUMERIC(18,2)
```

or

```text
DECIMAL(18,2)
```

for all monetary values.

---

# Future Features

The architecture is prepared for:

* POS
* Accounting
* Bank Accounts
* Cash Management
* Exchange Rate Providers
* Financial Statements
* General Ledger
* Multi-Currency Payments
* ERP Modules

No redesign should be required.

---

# Design Decisions

* Every company has one Reporting Currency.
* Every branch has one Operating Currency.
* Every transaction preserves its Original Currency.
* Every transaction stores:

  * Original Amount
  * Original Currency
  * Branch Amount
  * Branch Currency
  * Company Amount
  * Company Currency
  * Exchange Rate to Branch
  * Exchange Rate to Company
* Exchange rates are periodically synchronized from external providers.
* Transactions always use locally stored exchange rates.
* Historical transactions are immutable.
* Financial reports always use stored converted values.
* Monetary values use `NUMERIC` or `DECIMAL`, never floating-point types.

---

# Architecture Summary

```text
                    Company
            Reporting Currency (USD)
                     │
                     │
          ┌──────────┴──────────┐
          │                     │
     Branch A              Branch B
 Operating: ILS         Operating: JOD
          │                     │
          │                     │
      Customer Pays        Customer Pays
        100 EUR             50 GBP
          │                     │
          ▼                     ▼
 Original Currency      Original Currency
 Branch Amount          Branch Amount
 Company Amount         Company Amount
```
