# Ebtesamty — End-to-End Workflows & Acceptance Tests

## 1. Core End-to-End Workflows

### Workflow 1: New & Returning Patient Booking Journey
1. Visitor browses `/`, `/services/[slug]`, `/dentists`, or `/branches/[code]` and clicks **Book an Appointment** (`/book`).
2. Visitor selects a branch (`BR-A`, `BR-B`, or `BR-C`), clinical visit reason, preferred dentist (or any available dentist at that branch), and date.
3. The system queries live `DoctorDuty` shifts and existing `Appointment` slots via `/api/scheduling/availability` to display real open slots.
4. Visitor enters contact details; server checks for existing patient records and flags any potential duplicate (`PotentialDuplicateReview`) without auto-merging or overwriting existing patient files.
5. Booking request (`AppointmentRequest`) or confirmed reservation (`Appointment`) is created with a unique reference (`REQ-...`), `.ics` calendar download, and reception calendar visibility.

### Workflow 2: Multi-Visit Treatment Plan & Clinical Documentation
1. Patient arrives at the branch; receptionist verifies physical arrival (`ArrivalEvent.isVerified = true`) and places the patient into the live `QueueEntry` (`WAITING -> CALLED -> IN_CONSULTATION`).
2. Dentist opens `/dentist` and `/dentist/chart/[patientId]`, reviews the patient's versioned medical intake (`MedicalHistorySubmission`), and records surface findings on the interactive FDI Odontogram (`ToothFinding`).
3. Dentist creates or updates a multi-stage `TreatmentPlan` (`DRAFT -> PROPOSED -> ACCEPTED`), distinguishing `PLANNED` items from `PERFORMED` procedures linked to a finalized `Encounter`.
4. Finalized clinical encounters (`EncounterStatus.FINALIZED`) are locked against silent edits; subsequent clarifications are recorded via signed `ClinicalNoteAddendum` entries.

### Workflow 3: Doctor Unavailability & Exception Resolution
1. When a dentist's `DoctorDuty` is marked `CANCELLED` or `SUBSTITUTED`, the system identifies all overlapping `CONFIRMED` appointments on that shift.
2. Affected appointments are never deleted or silently reassigned; a `CoverageException` and `DOCTOR_ABSENT_WITH_BOOKINGS` operational alert are generated.
3. Receptionists and executives see the exception in `/reception/agenda` and `/management`, propose validated alternative slots or substitute dentists, and notify the patient.

### Workflow 4: Invoice, Payment, Installments & Cash Reconciliation
1. Completed clinical procedures or consultations generate an `Invoice` (`INV-YYYY-XXXX`) with itemized `InvoiceLine` entries in integer piasters.
2. Payments (`RCP-YYYY-XXXX`) are recorded via `/api/billing/payments` with a mandatory `idempotencyKey`, updating `Invoice.paidAmountPiasters` and transitioning status to `PARTIALLY_PAID` or `PAID`.
3. Remaining balances can be structured into an `InstallmentPlan`, and daily cash collections are reconciled via `CashReconciliation` (automatically triggering a `CASH_DISCREPANCY` alert if counted cash differs from expected cash).

### Workflow 5: Branch-to-Branch Inventory Transfer
1. Authorized staff create a `StockTransfer` (`REQUESTED`) specifying material, source branch, destination branch, and quantity.
2. Source branch dispatches the transfer (`SHIPPED`), atomically deducting from the source `StockLot` and logging a `TRANSFER_OUT` `StockMovement`.
3. Destination branch confirms receipt (`RECEIVED`), incrementing the destination `StockLot` and logging a `TRANSFER_IN` `StockMovement`. Total stock across the organization is conserved.

---

## 2. Automated Verification Matrix

### Integration Test Suites (`npm test` — Vitest against PostgreSQL)
- `tests/integration/t01_t07_identity_and_auth.test.ts` — Schema initialization, patient session isolation (403), walk-in registration without email, shared family phone support, duplicate candidate review, online self-registration anti-hijacking, and portal link verification.
- `tests/integration/t08_t13_clinical_and_management.test.ts` — Multi-step intake draft persistence, immutable version numbering, reception-assisted intake attribution, dentist sign-off, version superseding, and zero-PHI executive metrics.
- `tests/integration/sc01_sc15_scheduling_and_queues.test.ts` — Booking request lifecycle, slot double-booking prevention, doctor duty validation, 24h cancellation policy, arrival verification, queue transitions, and doctor unavailability exception handling.
- `tests/integration/cl01_cl10_clinical_records.test.ts` — Encounter draft/finalization immutability, signed clinical addenda, FDI tooth findings, multi-stage treatment plans, performed item linkage, and clinical document metadata.
- `tests/integration/fn01_fn12_billing_and_finance.test.ts` — Invoice generation, partial payments, idempotency key deduplication, installment plans, expenses, and cash drawer discrepancy alerts.
- `tests/integration/in01_in10_inventory_and_procurement.test.ts` — Material catalog, lot adjustments, negative-stock prevention, 3-step branch-to-branch transfers (`REQUESTED -> SHIPPED -> RECEIVED`), purchase orders, and goods receipts.
- `tests/integration/eq01_eq05_equipment_and_maintenance.test.ts` — Operatory asset tracking, fault reporting, maintenance work orders, and operational alert generation.
- `tests/integration/mg01_mg06_communications_and_management.test.ts` — In-app notifications, CRM feedback/inquiry lifecycle, low-stock alerts, and consolidated vs. branch-level executive KPIs.

### End-to-End Browser Test Suite (`npx playwright test` — Playwright Chromium)
- `tests/e2e/ebtesamty_phase01.spec.ts` — Full browser verification of Public Website pages, Booking Journey, Patient Portal, Receptionist Desk, Dentist Workspace, RBAC 403 enforcement, Owner Executive Dashboard, CRM Dashboard, and Bilingual Arabic RTL layout.
