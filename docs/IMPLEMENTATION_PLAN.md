# Ebtesamty — Implementation Plan & Status Tracker

## 1. Audit Summary of Existing Project

### Strengths Retained
- **Solid Relational Database & ORM**: PostgreSQL + Prisma schema (`prisma/schema.prisma`) with 35+ normalized models covering `Branch`, `Room`, `User`, `Session`, `RoleGrant`, `StaffProfile`, `Patient`, `PortalPatientLink`, `PotentialDuplicateReview`, `MedicalHistorySubmission`, `DoctorDuty`, `CoverageException`, `AppointmentRequest`, `Appointment`, `ArrivalEvent`, `QueueEntry`, `FollowUp`, `Encounter`, `ClinicalNoteAddendum`, `ToothFinding`, `TreatmentPlan`, `TreatmentPlanItem`, `DocumentMetadata`, `ServiceCatalogItem`, `Invoice`, `InvoiceLine`, `Payment`, `PaymentAllocation`, `InstallmentPlan`, `Installment`, `CashReconciliation`, `Expense`, `Material`, `StockLot`, `StockMovement`, `StockTransfer`, `Supplier`, `PurchaseRequest`, `PurchaseOrder`, `GoodsReceipt`, `EquipmentAsset`, `EquipmentFault`, `MaintenanceWorkOrder`, `Notification`, `FeedbackCase`, `OperationalAlert`, and `AuditEvent`.
- **Service Layer & Integration Tests**: Well-structured domain services in `src/services/*.ts` and 8 Vitest integration test suites (`tests/integration/*.test.ts`).

### Key Issues Identified & Addressed in Rebuild
1. **Color Palette & Brand Tokens**: Replaced legacy blue/orange theme (`#1356CC` / `#F59B20`) with the required **Ebtesamty Deep Teal (`#176C5B`)**, **Midnight Blue (`#163447`)**, **Warm Ivory (`#F7F8F5`)**, **Soft Mint (`#E3F0EB`)**, **White (`#FFFFFF`)**, and **Muted Terracotta (`#D58B57`)** across `tailwind.config.ts`, `globals.css`, public pages, and internal workspaces.
2. **Navigation & Scope Alignment**:
   - Removed the separate `BRANCH_MANAGER`, `SUPPLIER`, and `MAINTENANCE` standalone workspaces from `src/config/workspace-navigation.ts`.
   - Consolidated all executive and branch-level drill-down/comparison into **Owner / Executive Management (`/management`)**.
   - Added the dedicated **Marketing, CRM & Patient Retention (`/crm`)** workspace.
3. **Staffing Model Alignment (`prisma/seed.ts`)**:
   - Seeded the exact working model across the 3 Cairo branches: **Branch A (Heliopolis)** with 2 dentists (`Dr. Sandy Saad`, `Dr. Feby Samer`) + 1 receptionist (`Mariam Hanna`); **Branch B (New Cairo)** with 2 dentists (`Dr. Ahmed Hassan`, `Dr. Youssef El-Mansy`) + 1 receptionist (`Sandy Abd`); **Branch C (Maadi)** with 1 dentist (`Dr. Nadia El-hariry`) + 1 receptionist (`Salma Adel`), plus active `DoctorDuty` shifts for all 5 dentists.
4. **Public Website Completeness**:
   - Upgraded Homepage (`/`) with required section order, headline *"A Healthier Smile Starts with the Right Care."*, quick booking bar, treatment cards, 5 configured dentist profiles, Why Ebtesamty, 3 branch cards, patient reassurance, FAQs, and mobile bottom action bar.
   - Added data-driven Service Detail pages (`/services/[slug]`), dedicated Branch Detail pages (`/branches/[code]`), and all required public pages: `/new-patients`, `/emergency`, `/pricing`, `/education`, `/faqs`, and `/policies`.
5. **Real Slot Availability & 8-Step Booking Journey**:
   - Added `/api/scheduling/availability` computing real open time slots from `DoctorDuty` shifts and existing `Appointment` bookings, and built the 8-step booking experience at `/book` (and `/appointments/request`) with `.ics` calendar export.
6. **Patient Online Sandbox Payment & Portal Enhancements**:
   - Enabled patients in `/portal/billing` to pay outstanding invoices via a clearly labeled Sandbox Payment modal backed by idempotent `/api/billing/payments`.

---

## 2. Phase Execution Status

- [x] **Phase 0 — Audit & Specification**: Completed repository audit, database verification, and core documentation (`AGENTS.md`, `docs/PRODUCT_REQUIREMENTS.md`, `docs/DESIGN_SYSTEM.md`, `docs/DATA_MODEL.md`, `docs/ROLES_AND_PERMISSIONS.md`, `docs/INTEGRATIONS_AND_CONFIGURATION.md`, `docs/WORKFLOWS_AND_ACCEPTANCE_TESTS.md`, `docs/IMPLEMENTATION_PLAN.md`).
- [ ] **Phase 1 — Design System & Public Website**: Update brand tokens (`#176C5B`, `#163447`, `#F7F8F5`, `#E3F0EB`, `#D58B57`), Navbar/Footer, Homepage, `/services` & `/services/[slug]`, `/dentists`, `/branches` & `/branches/[code]`, `/about`, `/new-patients`, `/emergency`, `/pricing`, `/education`, `/faqs`, `/contact`, and `/policies`.
- [ ] **Phase 2 — Data Foundation, Seed Model & Authentication**: Update `prisma/seed.ts` for the 3-branch (2+2+1 dentists, 1+1+1 receptionists) model and `/demo` role switcher.
- [ ] **Phase 3 — Real Slot Availability, 8-Step Booking & Reception Desk**: Build `/api/scheduling/availability`, `/book`, and align `/reception` + `/reception/agenda`.
- [ ] **Phase 4 — Dentist Workspace & Patient Portal**: Verify FDI odontogram, clinical encounters, treatment plans, and upgrade `/portal` + `/portal/billing` with online sandbox payment.
- [ ] **Phase 5 — Finance & Inventory**: Verify `/billing`, `/inventory`, and `/purchasing` workflows and permissions.
- [ ] **Phase 6 — Owner Executive Dashboard, Marketing/CRM & Super Admin**: Build `/crm` (Marketing, CRM & Patient Retention), enhance `/management` (Owner consolidated + branch comparison/drill-down), and enhance `/admin` (Super Admin pricing, branches, dentist/service config, integration statuses, and audit trail).
- [ ] **Phase 7 — Verification & Testing**: Run `npm run typecheck`, `npm test`, `npm run build`, and `npx playwright test`.
