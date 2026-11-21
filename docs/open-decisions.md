# Ebtesamty Architectural & Open Decisions Log

**Document Version:** 1.0  
**Status:** Approved & Implemented (Phase 01)  
**Target Application:** Ebtesamty Dental Clinics (Multi-Branch Clinic Management System, Egypt)

---

## 1. Architectural Foundations

### 1.1 Database Engine: Native PostgreSQL Across All Environments
- **Decision:** Mandate PostgreSQL as the uniform relational engine across development, automated testing, staging, and production. Reject SQLite even for local developer convenience.
- **Windows Developer Setup:** In environments without Docker Desktop or administrative service privileges, leverage native PostgreSQL 18.x binaries (isolated user-space database cluster under `%USERPROFILE%\.ebtesamty_pgdata`).
- **Rationale:** Ensures Prisma generates genuine PostgreSQL dialect SQL, migration SQL scripts (`migration.sql`) are production-identical, constraints/enums behave identically, and JSONB / transactional isolation guarantees are tested accurately.

### 1.2 Authentication & Session Architecture
- **Decision:** Database-backed sessions stored in table `Session` with cryptographically secure 256-bit random tokens stored in HTTP-only, SameSite=Lax cookies (`ebtesamty_session`). Passwords hashed with bcrypt (salt rounds = 10).
- **Session Lifespan:** 8 hours for staff roles (Receptionist, Dentist, Manager, Admin) to prevent unattended desk hijacking; 7 days for portal patients with `SESSION_IDLE_TIMEOUT` checks.
- **No JWT in LocalStorage:** Mitigates XSS token leakage vectors in clinical desktop environments.

### 1.3 Identity Invariants & Anti-Hijacking Safeguards
- **Decision:** Phone number is NOT a unique key in the `Patient` table. A shared family or household phone (common in Egypt) may belong to multiple clinical records without merging or collision.
- **Email Uniqueness:** Only applies to `User` accounts (for portal credentials). Clinical patients created at reception desk do not require an email address.
- **Online Self-Registration Isolation:** A user who registers online creates a separate patient identity. The system **never** automatically merges an online self-registration into an existing clinical record based solely on matching name, phone, or email.
- **Portal Link Verification Workflow:** Unifying a portal login account with an existing clinic patient record requires a physical in-clinic or staff-verified `PortalPatientLink` approval (`PENDING` -> `APPROVED` / `REJECTED`), logged in `AuditEvent`.

### 1.4 Medical Intake: Versioned, Immutable, and Step-Draftable
- **Decision:** Form drafts are saved incrementally across 5 clinical sections using `MedicalIntakeDraft`.
- **Submission Immutability:** When submitted, the draft is converted into an immutable `MedicalHistoryVersion` with an incrementing integer `versionNumber`. Submitted versions can never be updated or deleted in place.
- **Dentist Review & Invalidation:** Dentists sign off on a specific `historyVersionId` via `DentistIntakeReview`. If a patient submits a newer version (e.g., medication change), previously signed reviews remain intact historically, but the patient's current intake status transitions to `PENDING_REVIEW` (`isCurrentVersion = false`).
- **Answer Schema:** Every medical inquiry accepts a tri-state answer (`YES`, `NO`, `UNKNOWN`) alongside optional detail text, preventing ambiguous null states.

### 1.5 Audit Logging & Patient Privacy (Zero PHI in Logs)
- **Decision:** The `AuditEvent` table captures operational metadata (actor ID, IP, user agent, action code, entity type, entity ID), but **strictly prohibits raw clinical PHI** (e.g., diagnoses, medications, allergy strings, full national ID).
- **Reception Search Projections:** Patient search endpoints filter by branch and query, returning minimal operational identifiers (Name, DOB, Patient Number, Phone), excluding medical intake answers.

---

## 2. Safe Provisional Choices (Phase 01)

| Area | Provisional Choice in Phase 01 | Production Hardening Path (Post-Phase 01) |
|---|---|---|
| **Patient Identification** | National ID is stored as optional encrypted string without automated Egyptian Civil Registry validation. | Integrate Ministry of Interior Civil Registry API verification or physical card scanner SDK. |
| **SMS OTP Verification** | Simulated OTP verification code in dev/seed logs (`123456`). | Plug in Egyptian SMS Gateway (e.g., Vodafone Egypt, Orange, or Twilio local sender ID). |
| **Care Team Assignment** | `AssignedDentist` relationship established at patient intake or reception check-in. | Phase 02 Appointment Scheduling engine dynamically creates episode-based care assignments. |
| **Medical Intake Questions** | Standard 5-section dental intake (Systemic Diseases, Bleeding/Allergies, Medications, Dental Symptoms, Habits). | Formal audit and legal sign-off by Egyptian Dental Syndicate clinical board. |
| **Minor Consent & Guardianship** | Basic guardian name and phone recorded on intake. | Formal legal guardianship verification workflow for patients under Egyptian civil legal age. |

---

## 3. Explicit Boundaries (Phases 02–06 Out of Scope)

The following modules are explicitly reserved for subsequent phases:
- **Phase 02:** Appointment booking, multi-chair calendar scheduling, chair assignment. (Represented in Phase 01 via informational modal: "Online Appointment Booking Coming in Phase 02").
- **Phase 03:** Clinical charting, odontogram, dental procedures, and treatment plans.
- **Phase 04:** Dental billing, invoices, receipts, and insurance claims.
- **Phase 05:** Central dental supply inventory, branch stock transfers, expiry tracking.
- **Phase 06:** Automated SMS/WhatsApp appointment reminders and patient surveys.
