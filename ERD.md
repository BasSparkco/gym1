# ERD.md

# Spark Gym ERP

## Entity Relationship Design

Version: 1.1

This document defines the MVP data model and identifies later-phase extensions that should not be treated as day-one scope.

---

# Design Principles

* MVP-First Scope
* SaaS Multi-Tenant Architecture
* Multi-Branch Support
* Modular Design
* Audit Friendly
* Future Expansion Ready

---

# Core Hierarchy

Tenant
└── Branches
	├── Users
	├── Members
	├── Membership Plans
	├── Memberships
	├── Visits
	├── Payments
	└── Notifications

---

# Tenant Module

## Tenant

Represents a customer account in the SaaS platform.

Fields

* Id
* Name
* Code
* Status
* CreatedAt
* UpdatedAt

Relationships

Tenant
├── Branches
├── Users
├── Members
├── MembershipPlans
└── Roles

---

# Branch Module

## Branch

Fields

* Id
* TenantId
* Name
* Code
* Address
* Phone
* Email
* Status

Relationships

Branch
├── Users
├── Members
├── Visits
└── Payments

---

# User Module

## User

System user.

Fields

* Id
* TenantId
* Username
* Email
* PasswordHash
* IsActive

Relationships

User
├── Roles
└── AuditLogs

---

# Role

Fields

* Id
* TenantId
* Name

---

# Permission

Fields

* Id
* Code
* Name

---

## User Role

Fields

* Id
* UserId
* RoleId
* BranchId

Relationships

UserRole
├── User
├── Role
└── Branch

---

## Role Permission

Fields

* Id
* RoleId
* PermissionId

Relationships

RolePermission
├── Role
└── Permission

---

# Member Module

## Member

Fields

* Id

* TenantId

* HomeBranchId

* MemberNumber

* FullName

* Gender

* BirthDate

* Mobile

* Email

* NationalId

* Photo

* City

* Address

* JoinDate

* EmergencyContactName

* EmergencyContactPhone

* MedicalNotes

* Status

Relationships

Member
├── Memberships
├── Visits
├── Payments
└── Notifications

---

# Membership Module

## Membership Plan

Fields

* Id

* TenantId

* Name

* PlanType

* DurationDays

* SessionCount

* Price

* AllowAllBranches

* FreezeAllowed

* FreezeDays

Relationships

Plan
└── Memberships

---

## Membership

Fields

* Id

* MemberId

* PlanId

* StartDate

* EndDate

* Status

* OriginalPrice

* DiscountAmount

* FinalPrice

Relationships

Membership
├── Payments
└── Freezes

---

## Membership Freeze

Fields

* Id

* MembershipId

* StartDate

* EndDate

* Reason

---

# Later-Phase Extensions

The following entities are retained for future expansion, but they are not part of the MVP commitment.

---

# Fitness Tracking Extension (Later Phase)

## Member Measurement

Stores historical body measurements.

Fields

* Id

* MemberId

* MeasurementDate

* Weight

* Height

* BodyFatPercentage

* MuscleMass

Relationships

Member
└── Measurements

---

# Attendance Module

## Visit

Fields

* Id

* MemberId

* BranchId

* CheckInTime

* CheckOutTime

* AccessMethod

Relationships

Visit
├── Member
└── Branch

---

# Advanced Access Control Extension (Later Phase)

Physical device integration is planned for later phases. The MVP uses `Visit.AccessMethod` for QR and manual access flows.

## Device

Fields

* Id

* BranchId

* Name

* Vendor

* Model

* DeviceType

* IPAddress

* Status

Relationships

Device
└── Events

---

## Device Event

Fields

* Id

* DeviceId

* MemberId

* EventType

* EventTime

Relationships

DeviceEvent
├── Device
└── Member

---

# Communication Module

## Notification

Fields

* Id

* MemberId

* Channel

* Subject

* Content

* Status

* SentAt

Relationships

Notification
└── Member

---

# Employee Module (Later Phase)

## Employee

Fields

* Id

* TenantId

* BranchId

* EmployeeNumber

* FullName

* Mobile

* Email

* Position

* HireDate

* Status

Relationships

Employee
├── Attendance
└── Payroll

---

# Martial Arts Module (Later Phase)

## Belt

Fields

* Id
* Name
* Rank

---

## Member Belt

Fields

* Id

* MemberId

* BeltId

* AwardDate

Relationships

MemberBelt
├── Member
└── Belt

---

# Payment Module

## Payment

Fields

* Id

* MemberId

* MembershipId

* BranchId

* Amount

* PaymentMethod

* Status

* PaymentDate

* ReferenceNumber

Relationships

Payment
├── Member
├── Membership
└── Branch

---

# Audit Module

## Audit Log

Fields

* Id

* UserId

* EntityType

* EntityId

* Action

* OldValues

* NewValues

* CreatedAt

Relationships

AuditLog
└── User

---

# MVP Scope

The first release will include:

* Tenant
* Branch
* Users
* Roles
* User Roles
* Role Permissions
* Members
* Membership Plans
* Memberships
* Membership Freeze
* Visits
* Notifications
* Payments
* Audit Logs
* Basic Reports

The following items are modeled as later-phase extensions and should not be treated as MVP scope:

* Member Measurements
* Physical Devices
* Device Events
* Employees
* Martial Arts Entities

Future modules will be added without major database redesign.
