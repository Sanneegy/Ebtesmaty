# Ebtesamty — Product Requirements & Scope Specification

## 1. Product Vision & Business Context

**Ebtesamty (ابتسامتي)** is an integrated public dental clinic website, patient portal, and multi-branch clinical and operational management platform built for a three-branch dental practice in Cairo, Egypt.

### Operating Model & Assumptions
- **Branches**: Three configured branches in Cairo:
  - **Branch A (`BR-A`)**: Heliopolis
  - **Branch B (`BR-B`)**: New Cairo
  - **Branch C (`BR-C`)**: Maadi
- **Initial Staffing Configuration**:
  - Two branches (`BR-A`, `BR-B`) operate with **2 dentists** and **1 receptionist** each.
  - One branch (`BR-C`) operates with **1 dentist** and **1 receptionist**.
- **Shared Patient Records**: Patients have a single enterprise identity (`EBT-PAT-YYYY-XXXX`) across all branches while preserving branch attribution on every appointment, clinical encounter, invoice, and payment.
- **Currency & Time Zone**: Egyptian Pounds (`EGP`, stored as integer piasters) and `Africa/Cairo` time zone.
- **Localization**: Bilingual English (`LTR`) and Arabic (`RTL`) across the public website, booking journey, patient portal, and internal workspaces.
- **Honest Data Policy**: All seeded records are explicitly labeled as fictional demonstration data. No fabricated awards, fake patient ratings, or unverified clinical claims are displayed.

---

## 2. Agreed Product & Dashboard Scope (10 Core Areas)

### Area 1: Public-Facing Website
- **Homepage (`/`)**: Empathetic hero ("A Healthier Smile Starts with the Right Care."), quick booking entry bar, treatment category cards, configured dentist profiles, "Why Ebtesamty?" clinical standards, 3-branch directory cards, patient reassurance section, FAQs, and footer.
- **Services Directory & Detail Pages (`/services`, `/services/[slug]`)**: Data-driven catalog covering General & Preventive Care, Dental Cleaning, Restorative Fillings, Root Canal Treatment (Endodontics), Crowns & Bridges (Prosthodontics), Dental Implants, Orthodontics, Cosmetic Dentistry, Teeth Whitening, and Pediatric Dentistry. Each detail page provides plain-language overview, process steps, candidate suitability, typical duration, transparent configurable price in EGP, cost factors, available branches/dentists, preparation/aftercare guidance, FAQs, and direct booking CTA.
- **Dentist Directory & Profiles (`/dentists`)**: Searchable and filterable directory by branch, specialty, and language with verified license numbers, qualifications, duty schedules, and direct booking links.
- **Branch Pages (`/branches`, `/branches/[code]`)**: Dedicated branch pages with distinct Cairo coordinates/map directions, addresses, phone numbers, operating hours, operatory suites, assigned dentists, available services, accessibility features, and branch-specific booking actions.
- **Additional Public Pages**:
  - **About Us (`/about`)**: Clinic story, mission, sterilization and clinical governance standards.
  - **New Patient Guide (`/new-patients`)**: First-visit preparation, medical intake overview, identity verification, and consent workflow.
  - **Emergency Dental Information (`/emergency`)**: Urgent dental triage guidance, staffed hours, direct branch emergency contact numbers, and clear medical disclaimer.
  - **Pricing & Payments (`/pricing`)**: Transparent fee schedule from the live catalog, factors affecting final quotes, accepted payment methods (Cash, Card/POS, InstaPay, Fawry), and installment rules.
  - **Patient Education (`/education`)**: Clinician-reviewed oral health guides, preventive care, and post-treatment aftercare instructions.
  - **FAQs (`/faqs`)**: Searchable and categorized administrative and clinical questions.
  - **Contact Us (`/contact`)**: Branch contact details, interactive inquiry form connected to the CRM inquiry pipeline (`/api/feedback`), and map links.
  - **Privacy, Terms & Policies (`/policies`)**: Privacy notice, booking and 24-hour cancellation terms, refund/adjustment rules, and WCAG 2.2 AA accessibility statement.

### Area 2: Online Appointment Booking Experience (`/book` & `/appointments/request`)
- **8-Step Guided Journey**:
  1. Choose a branch (`BR-A`, `BR-B`, `BR-C`).
  2. Select reason for visit / clinical category (including "I'm not sure").
  3. Select a specific qualified dentist at that branch or "Any Available Dentist".
  4. Select a date and real available time slot computed from `DoctorDuty`, existing `Appointment` records, duration, and booking rules.
  5. Enter patient details (supporting returning patient lookup and duplicate protection without auto-merging).
  6. Review summary (branch, dentist, visit reason, date/time, estimated consultation fee, cancellation policy).
  7. Submit booking request or instant slot reservation with server-side conflict detection.
  8. Receive unique booking reference, calendar export (`.ics`), branch directions, and portal link.

### Area 3: Patient Portal (`/portal`)
- **Dashboard (`/portal`)**: Next appointment summary, one-click arrival check-in, pending booking requests, treatment plan progress, verified balance due vs. unbilled treatment estimates, and notifications.
- **My Appointments (`/portal/appointments`)**: Upcoming/past visits, rescheduling, and cancellation (with 24-hour policy check).
- **My Treatment Plan & Medical Intake (`/portal/intake`)**: Multi-step versioned medical intake (`DRAFT -> PENDING_REVIEW -> REVIEWED`) and multi-visit treatment plan tracker (`PROPOSED`, `ACCEPTED`, `COMPLETED`).
- **My Payments (`/portal/billing`)**: Invoices, line items, payment receipts, installment schedules, and online sandbox payment flow with idempotency protection.
- **My Records & Support (`/portal/feedback`)**: Approved clinical documents, aftercare summaries, and administrative support/feedback tickets.

### Area 4: Receptionist / Front Desk Dashboard (`/reception`, `/reception/agenda`)
- Live database-derived daily overview counters (Today's scheduled, requests awaiting confirmation, unverified arrivals, waiting queue, in consultation, awaiting checkout).
- Day/week/month appointment calendar with doctor and branch filters, conflict warnings, and doctor unavailability resolution queue.
- Patient search (`Ctrl+K`), walk-in registration (without requiring email), duplicate candidate resolution, and physical ID verification for portal account linking.
- Live queue progression (`WAITING -> CALLED -> IN_CONSULTATION -> COMPLETED`) and administrative checkout handoff.

### Area 5: Dentist / Clinical Workspace (`/dentist`, `/dentist/chart/[patientId]`)
- Today's schedule, active chairside queue, and medical intake sign-off with clinical precaution flags.
- Interactive FDI Two-Digit Odontogram (`11–48`) with surface-level findings (`CARIES`, `RESTORED`, `MISSING`, `ROOT_CANAL_TREATED`, `FRACTURED`, `HEALTHY`) and attribution history.
- Clinical encounter lifecycle (`DRAFT -> FINALIZED`) with immutable finalized notes and signed `ClinicalNoteAddendum` records.
- Multi-stage treatment planning (`TreatmentPlan` & `TreatmentPlanItem`), linking performed procedures to encounters, follow-up recall scheduling, and clinical attachment metadata.

### Area 6: Owner / Executive Management Dashboard (`/management`)
- Consolidated and single-branch drill-down selector (`All Branches`, `BR-A`, `BR-B`, `BR-C`).
- Side-by-side branch comparison across appointment volume, attendance/no-show rates, capacity utilization, invoiced revenue, collected cash, operating expenses, and net operating margin.
- Actionable Executive Alert Center (`DOCTOR_ABSENT_WITH_BOOKINGS`, `LOW_STOCK_THRESHOLD`, `EQUIPMENT_OUT_OF_SERVICE`, `CASH_DISCREPANCY`, `PROLONGED_WAIT_TIME`).

### Area 7: Finance / Accountant Dashboard (`/billing`)
- Invoice creation linked to patients, branches, encounters, and `ServiceCatalogItem` pricing.
- Atomic, idempotent payment collection (`CASH`, `CREDIT_CARD`, `INSTAPAY`, `FAWRY`), partial payment allocations, and installment plans.
- Daily cash drawer reconciliation (`CashReconciliation`) with automatic discrepancy alerts, operating expense ledger (`Expense`), and financial aging/collection reports.

### Area 8: Inventory & Procurement Dashboard (`/inventory`, `/purchasing`)
- Dental material catalog (`Material`) with SKU, bilingual names, unit cost, and reorder thresholds.
- Branch-specific lot balances (`StockLot`) with expiry tracking and audited stock adjustments (`StockMovement`).
- Traceable branch-to-branch stock transfers (`REQUESTED -> SHIPPED -> RECEIVED`) ensuring conservation of total stock.
- Supplier directory, purchase requests, purchase orders (`PurchaseOrder`), and lot-verified goods receipts (`GoodsReceipt`).

### Area 9: Marketing, CRM & Patient Retention Dashboard (`/crm`)
- Inquiry and lead pipeline management (`OPEN`, `ASSIGNED`, `RESPONDED`, `RESOLVED`, `CLOSED`) with source attribution and booking conversion metrics.
- Patient retention & recall workbench powered by dentist-recommended `FollowUp` tasks (`PENDING`, `CONTACTED`, `SCHEDULED`, `DISMISSED`).
- Patient feedback, praise, and complaint resolution with privacy-safe communication templates (zero PHI in marketing messages).

### Area 10: Super Admin / System Configuration Dashboard (`/admin`)
- User account management, status control (`ACTIVE`, `SUSPENDED`), and branch-scoped RBAC role grants.
- Branch configuration (working hours, operatories, contact details), dentist & service catalog pricing configuration, integration status monitor (SMTP, SMS/WhatsApp, Payment Gateway sandbox vs. live status), and zero-PHI Audit Log Explorer.

---

## 3. Explicit Scope Exclusions
1. **No Standalone Branch Manager Dashboard**: Consolidated into `/management`.
2. **No HR / Payroll / Staff Attendance Module**.
3. **No Standalone Dental Assistant Dashboard**.
4. **No Standalone Lab, Supplier Portal, or Equipment Maintenance Department Dashboards** in global navigation.
