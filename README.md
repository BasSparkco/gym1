# README.md

# Spark Gym ERP

A modern SaaS platform for managing gyms, fitness centers, and multi-branch sports organizations, with future expansion into martial arts academies and swimming clubs.

Developed by SparkCo.

---

## Overview

Spark Gym ERP is a cloud-based multi-tenant platform designed to help gyms and fitness businesses manage daily operations from a single system.

MVP focus:

* Multi-branch organizations
* Membership management
* QR and manual access control
* Payment collection for memberships
* Basic reporting
* SMS, WhatsApp, Email, and Push notifications
* Multi-language support

Later phases:

* Advanced hardware integrations
* Employee management
* Class scheduling
* Training programs
* Nutrition plans
* POS and inventory
* Accounting and financial reporting
* Mobile applications
* AI-powered features

---

## Target Customers

Primary launch segment:

* Gyms
* Fitness Centers
* Women's Fitness Centers
* Multi-Branch Fitness Organizations

Expansion segments:

* Martial Arts Academies
* Swimming Centers
* Sports Clubs

---

## Key Features

### MVP Focus

* Tenant and branch setup
* Authentication and roles
* Member profiles
* Membership plans and renewals
* Visit tracking
* QR and manual access
* Membership payments
* Notifications
* Core reports

### Later-Phase Capabilities

The following capabilities are planned for later phases and should not be treated as MVP scope:

* Face recognition
* Fingerprint devices
* RFID cards
* Turnstile integration
* Payroll management
* Training programs
* Nutrition plans
* POS and inventory
* Advanced financial management
* Mobile applications
* AI features

### Member Management

* Member profiles
* Memberships
* Visits tracking
* Member photos
* Medical notes
* Emergency contacts
* Belt management for martial arts

### Membership Management

* Monthly plans
* Annual plans
* Session-based plans
* Membership freeze
* Membership renewal
* Expiration reminders

### Access Control

* QR Codes
* Manual validation
* Access logs

Later:

* Face recognition
* Fingerprint devices
* RFID cards
* Turnstile integration
* Gate control systems

### Communication

* SMS notifications
* WhatsApp notifications
* Email notifications
* Push notifications
* Automated reminders

### Human Resources

* Employee profiles
* Attendance tracking
* Roles and permissions

Later:

* Payroll management

### Training Management

Planned for later phases.

### Nutrition Management

Planned for later phases.

### POS & Inventory

Planned for later phases.

### Financial Management

MVP focus:

* Membership payments
* Revenue visibility for membership sales

Later:

* Expenses
* Debts
* Budget reports
* Full accounting workflows

### Reporting

* Membership reports
* Attendance reports
* Employee reports
* Financial reports
* Sales reports
* Inventory reports

---

## Multi-Tenant Architecture

The platform is designed as a SaaS solution.

Structure:

Tenant
└── Organization
└── Branches
├── Members
├── Employees
├── Inventory
├── Classes
├── Devices

---

## Supported Languages

* Arabic
* English
* Hebrew

Future-ready for additional languages.

---

## Technology Stack

Frontend

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui

Backend

* NestJS
* TypeScript

Database

* PostgreSQL

Infrastructure

* Docker
* Redis
* MinIO
* Traefik

Package Manager

* pnpm is the standard package manager for this project.
* Use pnpm for frontend, backend, and shared workspace commands.
* Avoid npm-based setup and install steps unless there is a specific exception.

Mobile

* Flutter (planned for later phases)

---

## Project Goals

* Build a modern gym management platform.
* Launch a focused MVP for gyms and fitness centers.
* Integrate QR-based access in the first release.
* Expand to physical access devices in later phases.
* Support regional and international markets.
* Enable recurring SaaS revenue.
* Provide white-label capabilities.
