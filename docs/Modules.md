# Modules.md

# Spark Gym ERP Modules

This document aligns module boundaries with the current MVP-first roadmap.
Not every module is part of the first release.

## Architecture Style

Modular Monolith

Each module owns:

* Business Logic
* Database Models
* APIs
* Permissions
* Reports

Modules communicate through services and events.

## Delivery Scope

* MVP: Required for the first pilot-ready web release.
* Phase 2: Operational expansion after MVP validation.
* Phase 3: Commerce and back-office expansion.
* Phase 4+: Integration, mobile, and advanced feature phases.
* Future: Strategic extensions that are not committed to an early delivery phase.

---

# 1. Core Module (MVP)

Purpose

Foundation of the entire system.

Responsibilities

* Authentication
* Authorization
* Roles
* Permissions
* User Management
* Settings
* Audit Logs
* Branch-scoped access
* Languages
* Localization

Entities

* User
* Role
* Permission
* UserRole
* RolePermission
* AuditLog
* Setting

---

# 2. Tenant Module (MVP with Later Billing Expansion)

Purpose

Support SaaS multi-tenancy.

Current Model

The current MVP treats the tenant as the customer account. A separate organization entity is not required in the first release.

Responsibilities

* Tenants
* Tenant lifecycle
* Tenant settings
* Branch ownership

Later Responsibilities

* Subscription plans
* Billing

Entities

* Tenant

Later Entities

* SubscriptionPlan
* TenantSubscription

---

# 3. Branch Module (MVP)

Purpose

Manage club branches.

Responsibilities

* Branch creation
* Branch settings
* Branch operating hours
* Branch contact details

Entities

* Branch

---

# 4. Member Module (MVP with Later Profile Expansion)

Purpose

Manage club members.

Responsibilities

* Member profiles
* Member status
* Medical notes
* Emergency contacts

Later Responsibilities

* Member documents
* Member notes

Entities

* Member

Later Entities

* MemberDocument
* MemberNote

---

# 5. Membership Module (MVP)

Purpose

Manage subscriptions.

Responsibilities

* Membership plans
* Membership activation
* Renewal
* Freeze
* Expiration
* Session-based and duration-based plans

Entities

* MembershipPlan
* Membership
* MembershipFreeze

---

# 6. Access Control Module (MVP with Phase 4 Device Expansion)

Purpose

Control member access.

Responsibilities

* Entry validation
* QR access
* Manual validation
* Access rules

Later Responsibilities

* Device integrations
* Physical device event ingestion
* Anti-passback and gate logic

Entities

MVP data is represented through visit records and access method rules.

Later Entities

* Device
* DeviceEvent

Supported Devices

* QR Code
* Manual Validation

Later Supported Devices

* Face Recognition
* Fingerprint
* RFID
* Turnstile

---

# 7. Attendance Module (MVP)

Purpose

Track member visits.

Responsibilities

* Check-in
* Check-out
* Visit history
* Branch visit tracking

Entities

* Visit

---

# 8. Martial Arts Module (Future Expansion)

Purpose

Support martial arts academies.

Responsibilities

* Belt tracking
* Exams
* Promotions

Entities

* Belt
* BeltExam
* BeltPromotion

---

# 9. Class Management Module (Phase 2)

Purpose

Manage classes and training groups.

Responsibilities

* Classes
* Reservations
* Attendance

Entities

* Class
* ClassSchedule
* ClassReservation
* ClassAttendance

---

# 10. Training Program Module (Phase 6)

Purpose

Workout planning.

Responsibilities

* Exercise programs
* Progress tracking

Entities

* Exercise
* TrainingProgram
* TrainingProgramItem

---

# 11. Nutrition Module (Phase 6)

Purpose

Nutrition planning.

Responsibilities

* Meal plans
* Nutrition programs

Entities

* Meal
* NutritionPlan
* NutritionPlanItem

---

# 12. Communication Module (MVP with Later Mobile Expansion)

Purpose

Messaging and notifications.

Responsibilities

* SMS
* WhatsApp
* Email

Later Responsibilities

* Push Notifications

Entities

* Notification

Later Entities

* MessageTemplate
* MessageLog

---

# 13. HR Module (Phase 2 with Phase 3 Payroll Expansion)

Purpose

Employee management.

Responsibilities

* Employee records
* Attendance

Later Responsibilities

* Payroll
* Shift planning
* Task support

Entities

* Employee
* AttendanceRecord

Later Entities

* Payroll

---

# 14. Locker Module (Phase 2)

Purpose

Manage rented lockers.

Responsibilities

* Locker assignment
* Rental tracking

Entities

* Locker
* LockerRental

---

# 15. POS Module (Phase 3)

Purpose

Retail sales inside the club.

Responsibilities

* Sales
* Returns
* Discounts

Entities

* Sale
* SaleItem
* Receipt

---

# 16. Inventory Module (Phase 3)

Purpose

Inventory control.

Responsibilities

* Products
* Purchases
* Stock movements

Entities

* Product
* Category
* Purchase
* PurchaseItem
* StockMovement

---

# 17. Accounting Module (Phase 3)

Purpose

Financial management.

Responsibilities

* Expenses
* Revenues
* Cash transactions

Entities

* Expense
* Revenue
* CashTransaction

---

# 18. Payment Module (MVP with Phase 4 Gateway Expansion)

Purpose

Online and offline payments.

Responsibilities

* Membership payment collection
* Payment history
* Receipt and reference tracking

Later Responsibilities

* Gateway integrations
* Online payments

Entities

* Payment

Later Entities

* PaymentMethod
* PaymentTransaction

---

# 19. Reporting Module (MVP with Later Analytics Expansion)

Purpose

Generate business reports.

Responsibilities

* Membership reports
* Attendance reports
* Payment summary reports

Later Responsibilities

* Sales reports
* Financial reports
* Advanced analytics

Entities

MVP reporting can be query-driven and may not require dedicated persisted report entities.

Later Entities

* ReportDefinition
* ReportExecution

---

# 20. Mobile App Module (Phase 5)

Purpose

Serve mobile applications.

Responsibilities

* Member API
* Employee API
* Push notifications

---

# 21. Public API Module (Phase 4)

Purpose

External integrations.

Responsibilities

* Partner APIs
* Device APIs
* Third-party integrations

Entities

* ApiClient
* ApiToken

---

# Future Expansion Modules

* AI Assistant
* AI Nutrition
* AI Training
* CRM
* Marketing Automation
* Business Intelligence
