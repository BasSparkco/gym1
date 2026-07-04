# Currencies Design

## Purpose

This document defines the currency architecture used across all SparkCo SaaS applications.

The goal is to build a financial foundation that supports:

* Gym Management
* POS
* Accounting
* E-Commerce
* Future SaaS products

The design must support multiple countries, multiple branches, and future accounting features without requiring database redesign.

---

# General Principles

## Branch-Based Financial Entity

The financial entity in the system is the **Branch**, not the Company.

A company may own multiple branches operating in different countries.

Example:

```
Spark Fitness

├── Tel Aviv Branch
│   Base Currency: ILS
│
├── Amman Branch
│   Base Currency: JOD
│
└── Dubai Branch
    Base Currency: AED
```

Each branch manages its own financial records using its own base currency.

---

# Base Currency

Every branch must have exactly one **Base Currency**.

The base currency is selected during branch creation.

Example:

```
Branch Name:
Tel Aviv

Base Currency:
ILS
```

All financial reports generated for that branch must use the base currency.

Examples:

* Profit & Loss
* Expenses
* Revenue
* Cash Flow
* Financial Summary

---

# Changing the Base Currency

The base currency may only be changed **before any financial transaction exists**.

Once the first financial transaction is created, the base currency becomes immutable.

Reason:

Changing the base currency would invalidate:

* Financial reports
* Historical balances
* Accounting records
* Stored base amounts

Therefore:

```
Transactions == 0

✓ Base Currency can be changed
```

```
Transactions > 0

✗ Base Currency cannot be changed
```

---

# Currency Table

A dedicated currency table must exist.

Suggested structure:

```
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

Examples:

| Code | Symbol | Name            |
| ---- | ------ | --------------- |
| ILS  | ₪      | Israeli Shekel  |
| USD  | $      | US Dollar       |
| EUR  | €      | Euro            |
| JOD  | JD     | Jordanian Dinar |
| SAR  | ﷼      | Saudi Riyal     |
| AED  | د.إ    | UAE Dirham      |
| EGP  | E£     | Egyptian Pound  |

Currencies should be seeded during installation.

---

# Financial Transactions

Every financial transaction must preserve both:

* The original payment information
* The accounting value in the branch's base currency

Example:

Customer pays:

```
100 USD
```

Exchange Rate:

```
1 USD = 3.65 ILS
```

Stored values:

```
Original Amount:
100

Original Currency:
USD

Exchange Rate:
3.65

Base Amount:
365.00
```

This allows:

* Accurate accounting
* Historical consistency
* Future auditing
* Multi-currency reporting

---

# Why Store Both Amounts?

Never replace the original payment with the converted amount.

Incorrect:

```
365 ILS
```

Correct:

```
Original Amount:
100 USD

Exchange Rate:
3.65

Base Amount:
365 ILS
```

The original payment must always remain available.

---

# Exchange Rate

The exchange rate must be stored with every transaction.

The stored rate must never change.

Future exchange-rate updates must not affect historical transactions.

Example:

```
Transaction Date:
2026-07-04

Original:
100 USD

Rate:
3.65

Base:
365 ILS
```

If the exchange rate becomes:

```
3.90
```

the historical transaction must remain unchanged.

---

# Reports

Financial reports always use the branch base currency.

Examples:

* Profit & Loss
* Revenue
* Expenses
* Membership Income
* Product Sales
* Cash Reports

All totals must be calculated using **Base Amount**.

---

# Original Currency Reports

The system should also be able to generate reports grouped by original currency.

Example:

```
Received Today

ILS
25,000

USD
430

EUR
180
```

This information is only available if the original currency is stored.

---

# Database Recommendations

Money values must never use floating-point data types.

Do NOT use:

* FLOAT
* DOUBLE

Use:

```
NUMERIC(18,2)
```

or

```
DECIMAL(18,2)
```

depending on project standards.

---

# Future Features

The currency design is prepared for future implementation of:

* POS
* Accounting
* Cash Management
* Bank Accounts
* Exchange Rates
* Financial Statements
* Multi-Currency Payments

No database redesign should be required.

---

# Design Decisions

* Financial entity is the **Branch**.
* Every branch has exactly one base currency.
* Base currency is selected during branch creation.
* Base currency cannot be changed after financial transactions exist.
* Every transaction stores:

  * Original Amount
  * Original Currency
  * Exchange Rate
  * Base Amount
* Financial reports always use the branch base currency.
* Historical exchange rates are preserved permanently.
* Monetary values use `NUMERIC` / `DECIMAL`, never floating-point types.

---

# Future Considerations

Potential future enhancements include:

* Exchange rate management
* Automatic exchange rate providers
* Multi-currency invoices
* Multi-currency payments within a single transaction
* Financial period locking
* Full double-entry accounting integration
