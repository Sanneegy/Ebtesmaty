# Ebtesamty feature parity audit

Audit started 12 November 2026. This is a source inventory and gap baseline, not feature-parity certification. No entire module is marked fully verified from route existence.

## Reference

Public module index: https://dentoflow-ai.com/en/our-features . Detailed appointment, clinical, inventory and profit pages reviewed. Public marketing is not proof of private implementation. The 17 module names below follow the requested benchmark; the detailed acceptance requirements are the user brief. No proprietary code or assets copied.

## Immediate outage

Local web process was stopped. Database recovery after interrupted shutdown completed. Restarted existing presentation service without reseeding. HTTP home, login and demo returned 200. Browser verification pending at this baseline.

## Module gap matrix

### 1. Dashboard
- Location: /management
- Existing implementation: management.service.ts; ExecutiveReport.tsx
- Missing/broken capabilities and UI improvements: Branch metrics and charts exist; definitions and drill-down reconciliation need complete coverage.
- Roles: OWNER_ADMIN
- Dependencies: Appointment, Invoice, Payment, Expense
- Required verification: Reconcile each KPI to source records and date basis
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 2. Appointments and calendar
- Location: /reception/agenda; /book
- Existing implementation: booking.service.ts; scheduling.service.ts
- Missing/broken capabilities and UI improvements: Day/week filtered list exists, not a full chair calendar. Drag/drop and earlier-opening waiting list missing.
- Roles: RECEPTIONIST; patient self
- Dependencies: Appointment, AppointmentRequest, Room, DoctorDuty
- Required verification: Concurrent bookings, reschedule, cancel, all three workspace views
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 3. Patient records
- Location: /reception/patients; /dentist/chart/[patientId]
- Existing implementation: patient.service.ts; intake.service.ts
- Missing/broken capabilities and UI improvements: Identity, duplicate review and intake exist; unified history and prescription coverage need verification.
- Roles: Assigned DENTIST; RECEPTIONIST limited; patient self
- Dependencies: Patient, PortalPatientLink, MedicalHistorySubmission
- Required verification: Shared phone must not silently merge; cross-patient denial
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 4. Lead follow-up CRM
- Location: /crm
- Existing implementation: LeadActivity.tsx; api/crm/activity
- Missing/broken capabilities and UI improvements: Contact and appointment links exist; full inquiry-to-attendance browser scenario remains unverified.
- Roles: CRM explicit grant
- Dependencies: InquiryActivity, Appointment, Patient
- Required verification: Create inquiry, contact, link booking, attendance funnel
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 5. Inbox and WhatsApp
- Location: /crm; /admin
- Existing implementation: communications.service.ts
- Missing/broken capabilities and UI improvements: Database notifications exist. No verified provider delivery/shared external inbox.
- Roles: CRM; authenticated notification owner
- Dependencies: Notification, FeedbackCase
- Required verification: Missing credentials must not report external delivery
- Status: **Requires External Integration**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 6. Exam room and dental chart
- Location: /dentist/chart/[patientId]
- Existing implementation: clinical.service.ts; components/clinical/ToothChart.tsx
- Missing/broken capabilities and UI improvements: Encounter and plan APIs exist. Chart was hidden following earlier request; latest brief requests interactive chart. Surface/pediatric coverage and plan-to-invoice linkage incomplete.
- Roles: Assigned DENTIST
- Dependencies: Encounter, ToothFinding, TreatmentPlan, TreatmentPlanItem
- Required verification: Draft/finalize/addendum; uncharted neutral; consent and duplicate billing
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 7. X-ray and CBCT viewer
- Location: /dentist/chart/[patientId]; /portal/records
- Existing implementation: api/clinical/documents
- Missing/broken capabilities and UI improvements: Private image/PDF upload/download exists. Advanced DICOM/CBCT rendering and clinical measurements not implemented.
- Roles: Assigned DENTIST; linked patient
- Dependencies: DocumentMetadata; private file storage
- Required verification: Upload, byte validation, download, unauthorized denial, visit linkage
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 8. Finance center
- Location: /billing
- Existing implementation: billing.service.ts; payment.service.ts
- Missing/broken capabilities and UI improvements: Invoices, allocations, installments, expenses and cash reconciliation exist. Draft correction/void, treatment-item billing and exports require full audit.
- Roles: FINANCE; reception checkout
- Dependencies: Invoice, Payment, PaymentAllocation, Installment, Expense
- Required verification: Partial payment, duplicate payment, reconciliation, portal agreement
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 9. Profit and profitability
- Location: /management; /billing
- Existing implementation: management.service.ts
- Missing/broken capabilities and UI improvements: No configured case cost attribution or commission rules found. Collections are not profit.
- Roles: OWNER_ADMIN; FINANCE
- Dependencies: Expense and StockMovement insufficient for full case costing
- Required verification: Define actual cost/commission inputs before publishing margins
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 10. Inventory and supplies
- Location: /inventory; /purchasing
- Existing implementation: inventory.service.ts; StockWorkspace.tsx
- Missing/broken capabilities and UI improvements: Catalog, lots, reorder, receipts, transfers and adjustments exist. Procurement page currently reads all branches; consumption recipes, locations and full stocktake workflow incomplete.
- Roles: INVENTORY explicit grant; owner read oversight
- Dependencies: Material, StockLot, StockMovement, PurchaseOrder, GoodsReceipt
- Required verification: Partial receipt, expiry, stock-page refresh, simultaneous mutations, cross-branch denial
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 11. Lab management
- Location: Existing clinical/finance context only
- Existing implementation: No standalone approved workspace
- Missing/broken capabilities and UI improvements: Standalone lab dashboard excluded; attributable external costs not yet complete.
- Roles: No new role
- Dependencies: No dedicated case lab model verified
- Required verification: Scope conflict: do not add standalone dashboard
- Status: **Outside Previously Approved Scope**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 12. Attendance
- Location: No standalone workspace
- Existing implementation: DoctorDuty only supports booking
- Missing/broken capabilities and UI improvements: HR, attendance and payroll explicitly excluded.
- Roles: No new role
- Dependencies: DoctorDuty is availability, not attendance
- Required verification: Ensure scheduling is not mislabeled HR
- Status: **Outside Previously Approved Scope**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 13. Roles and permissions
- Location: All server routes; /admin
- Existing implementation: lib/rbac.ts; operational-auth.ts
- Missing/broken capabilities and UI improvements: Explicit grants, branch scope and clinical assignment exist. Purchasing reads found unscoped; full endpoint matrix needs verification.
- Roles: RoleGrant and branch restrictions
- Dependencies: RoleGrant, Session, PatientCareAssignment
- Required verification: Anonymous, wrong role, wrong branch and wrong patient rejection
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 14. Clinic website and patient portal
- Location: Public routes; /portal
- Existing implementation: PatientBooking.tsx; portal pages
- Missing/broken capabilities and UI improvements: Shared records and online requests exist; each self-service transition needs browser coverage.
- Roles: Public limited; patient self
- Dependencies: AppointmentRequest, PortalPatientLink, Invoice
- Required verification: Book, approve, reschedule/cancel, documents, balances
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 15. Mobile experience
- Location: Existing responsive web routes
- Existing implementation: AppShell.tsx; responsive CSS
- Missing/broken capabilities and UI improvements: Previous screenshots are historical evidence only. No native app claim; PWA installation not verified.
- Roles: Same server roles
- Dependencies: Existing application
- Required verification: 390px and tablet flows including forms and dialogs
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 16. Statistics and reports
- Location: /management?view=reports
- Existing implementation: ExecutiveReport.tsx; OwnerCharts
- Missing/broken capabilities and UI improvements: Database charts exist; custom metrics and all exports not verified.
- Roles: OWNER_ADMIN; explicit department reads
- Dependencies: Appointment, Invoice, Payment, InquiryActivity, StockMovement
- Required verification: Branch/period changes and source-record reconciliation
- Status: **Partially Implemented**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

### 17. AI assistant
- Location: No working assistant identified
- Existing implementation: No authorized retrieval/answer pipeline found
- Missing/broken capabilities and UI improvements: Requires implementation and external provider configuration; no working AI claim.
- Roles: Permission-filtered retrieval required
- Dependencies: No verified retrieval model
- Required verification: No PHI leakage; grounded answers and unavailable-provider state
- Status: **Requires External Integration**
- Evidence: source inspection; previous tests in docs/MASTER_INTEGRATION_AND_QA.md are historical, not a new acceptance pass.
- Repaired/new in this audit: none at baseline.

## Full source inventory

Entries below are discovery evidence, not verified behavior. Each API lists locally visible guards; delegated guards still require review. Forms/actions are located by source line for follow-up.

### Routes and APIs

- src/app/about/page.tsx: page; guards: inspect delegated logic/public access
- src/app/admin/page.tsx: page; guards: getOperationalUser, getCurrentUser, hasRole
- src/app/api/admin/audit-logs/route.ts: GET; guards: getOperationalUser, getCurrentUser, hasRole
- src/app/api/admin/users/route.ts: GET, POST; guards: getOperationalUser, getCurrentUser, hasRole
- src/app/api/auth/demo-switch/route.ts: POST; guards: inspect delegated logic/public access
- src/app/api/auth/login/route.ts: POST; guards: inspect delegated logic/public access
- src/app/api/auth/logout/route.ts: POST, GET; guards: inspect delegated logic/public access
- src/app/api/auth/register/route.ts: POST; guards: inspect delegated logic/public access
- src/app/api/billing/analytics/route.ts: GET; guards: getOperationalUser, getCurrentUser, requireRole
- src/app/api/billing/catalog/route.ts: GET; guards: getOperationalUser, getCurrentUser
- src/app/api/billing/expenses/route.ts: GET, POST; guards: getOperationalUser, getCurrentUser, requireRole
- src/app/api/billing/installments/route.ts: POST; guards: getOperationalUser, getCurrentUser, requireRole
- src/app/api/billing/invoices/route.ts: GET, POST; guards: getOperationalUser, branchScope, getCurrentUser, requireRole
- src/app/api/billing/payments/route.ts: GET, POST; guards: getOperationalUser, branchScope, getCurrentUser, requireRole
- src/app/api/billing/reconcile/route.ts: POST; guards: getOperationalUser, getCurrentUser, requireRole
- src/app/api/clinical/documents/route.ts: GET, POST; guards: getOperationalUser, requireClinicalAccess, requireRole
- src/app/api/clinical/encounters/route.ts: GET, POST; guards: getOperationalUser, requireClinicalAccess, getCurrentUser, requireRole
- src/app/api/clinical/encounters/[id]/addenda/route.ts: POST; guards: getOperationalUser, requireClinicalAccess, getCurrentUser, requireRole
- src/app/api/clinical/encounters/[id]/route.ts: GET, PATCH; guards: getOperationalUser, requireClinicalAccess, getCurrentUser, requireRole
- src/app/api/clinical/summary/route.ts: GET; guards: getOperationalUser, requireClinicalAccess, getCurrentUser, requireRole
- src/app/api/clinical/teeth/route.ts: GET, POST; guards: getOperationalUser, requireClinicalAccess, getCurrentUser, requireRole
- src/app/api/clinical/treatment-plans/route.ts: GET, POST; guards: getOperationalUser, requireClinicalAccess, getCurrentUser, requireRole
- src/app/api/clinical/treatment-plans/[id]/route.ts: PATCH; guards: getOperationalUser, requireClinicalAccess, getCurrentUser, requireRole
- src/app/api/communications/notifications/route.ts: GET; guards: getCurrentUser
- src/app/api/communications/notifications/[id]/read/route.ts: POST; guards: getCurrentUser
- src/app/api/crm/activity/route.ts: POST; guards: getOperationalUser, requireRole
- src/app/api/crm/recalls/route.ts: PATCH; guards: hasRole, getOperationalUser, getCurrentUser
- src/app/api/equipment/assets/route.ts: GET, POST; guards: getOperationalUser, getCurrentUser
- src/app/api/equipment/faults/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/equipment/orders/route.ts: GET, POST; guards: getOperationalUser, getCurrentUser
- src/app/api/equipment/orders/[id]/complete/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/equipment/orders/[id]/verify/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/equipment/summary/route.ts: GET; guards: getOperationalUser, getCurrentUser
- src/app/api/feedback/route.ts: GET, POST; guards: branchScope, hasRole, getCurrentUser
- src/app/api/feedback/[id]/respond/route.ts: POST; guards: hasRole, getCurrentUser
- src/app/api/intake/draft/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/intake/review/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/intake/submit/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/inventory/adjustments/route.ts: POST; guards: getOperationalUser, requireRole, hasRole, getCurrentUser
- src/app/api/inventory/balances/route.ts: GET; guards: getOperationalUser, requireRole, hasRole, getCurrentUser
- src/app/api/inventory/materials/route.ts: GET, POST; guards: getOperationalUser, hasRole, getCurrentUser, requireRole
- src/app/api/inventory/orders/route.ts: GET, POST; guards: getOperationalUser, requireRole, hasRole, getCurrentUser
- src/app/api/inventory/receipts/route.ts: GET, POST; guards: getOperationalUser, requireRole, hasRole, getCurrentUser
- src/app/api/inventory/reorder-policy/route.ts: PATCH; guards: getOperationalUser, requireRole
- src/app/api/inventory/suppliers/route.ts: GET, POST; guards: getOperationalUser, hasRole, getCurrentUser
- src/app/api/inventory/transfers/route.ts: GET, POST; guards: getOperationalUser, requireRole, hasRole, getCurrentUser
- src/app/api/inventory/transfers/[id]/receive/route.ts: POST; guards: getOperationalUser, requireRole, hasRole, getCurrentUser
- src/app/api/inventory/transfers/[id]/ship/route.ts: POST; guards: getOperationalUser, requireRole, hasRole, getCurrentUser
- src/app/api/management/alerts/route.ts: GET; guards: getCurrentUser
- src/app/api/management/alerts/[id]/resolve/route.ts: POST; guards: getCurrentUser
- src/app/api/management/kpis/route.ts: GET; guards: getCurrentUser
- src/app/api/patients/create/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/patients/me/route.ts: GET; guards: getOperationalUser, getCurrentUser
- src/app/api/patients/resolve-duplicate/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/patients/search/route.ts: GET; guards: getOperationalUser, getCurrentUser
- src/app/api/patients/verify-link/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/scheduling/arrivals/route.ts: GET, POST; guards: getOperationalUser, getCurrentUser, hasRole
- src/app/api/scheduling/arrivals/[id]/verify/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/scheduling/availability/route.ts: GET; guards: inspect delegated logic/public access
- src/app/api/scheduling/manage/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/scheduling/policy/route.ts: GET, PUT; guards: getOperationalUser, getCurrentUser, requireRole
- src/app/api/scheduling/queue/route.ts: GET, POST; guards: getOperationalUser, getCurrentUser, requireRole, hasRole
- src/app/api/scheduling/queue/[id]/priority/route.ts: POST; guards: getOperationalUser, getCurrentUser, requireRole
- src/app/api/scheduling/queue/[id]/transition/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/scheduling/requests/route.ts: GET, POST; guards: getOperationalUser, branchScope, hasRole, getCurrentUser
- src/app/api/scheduling/requests/[id]/respond/route.ts: POST; guards: getOperationalUser, getCurrentUser
- src/app/api/scheduling/requests/[id]/review/route.ts: POST; guards: getOperationalUser, getCurrentUser, requireRole
- src/app/api/supplier/orders/route.ts: GET, PATCH; guards: getOperationalUser, hasRole, getCurrentUser
- src/app/appointments/request/page.tsx: page; guards: inspect delegated logic/public access
- src/app/auth/login/page.tsx: page; guards: inspect delegated logic/public access
- src/app/auth/register/page.tsx: page; guards: inspect delegated logic/public access
- src/app/billing/page.tsx: page; guards: getOperationalUser, getCurrentUser, branchScope, hasRole
- src/app/book/page.tsx: page; guards: inspect delegated logic/public access
- src/app/branches/page.tsx: page; guards: inspect delegated logic/public access
- src/app/branches/[code]/page.tsx: page; guards: inspect delegated logic/public access
- src/app/contact/page.tsx: page; guards: inspect delegated logic/public access
- src/app/crm/page.tsx: page; guards: getOperationalUser, branchScope, getCurrentUser
- src/app/demo/page.tsx: page; guards: inspect delegated logic/public access
- src/app/dentist/chart/[patientId]/page.tsx: page; guards: getOperationalUser, getCurrentUser, branchScope, hasRole
- src/app/dentist/page.tsx: page; guards: getOperationalUser, getCurrentUser, hasRole
- src/app/dentist/[desk]/page.tsx: page; guards: getOperationalUser, getCurrentUser
- src/app/dentists/page.tsx: page; guards: inspect delegated logic/public access
- src/app/education/page.tsx: page; guards: inspect delegated logic/public access
- src/app/emergency/page.tsx: page; guards: inspect delegated logic/public access
- src/app/faqs/page.tsx: page; guards: inspect delegated logic/public access
- src/app/inventory/page.tsx: page; guards: getOperationalUser, branchScope, getCurrentUser, hasRole
- src/app/management/page.tsx: page; guards: getCurrentUser, hasRole
- src/app/new-patients/page.tsx: page; guards: inspect delegated logic/public access
- src/app/operations/equipment/page.tsx: page; guards: inspect delegated logic/public access
- src/app/page.tsx: page; guards: inspect delegated logic/public access
- src/app/policies/page.tsx: page; guards: inspect delegated logic/public access
- src/app/portal/appointments/page.tsx: page; guards: inspect delegated logic/public access
- src/app/portal/billing/page.tsx: page; guards: getCurrentUser
- src/app/portal/check-in/page.tsx: page; guards: inspect delegated logic/public access
- src/app/portal/feedback/page.tsx: page; guards: getCurrentUser
- src/app/portal/intake/page.tsx: page; guards: inspect delegated logic/public access
- src/app/portal/page.tsx: page; guards: getCurrentUser
- src/app/portal/records/page.tsx: page; guards: getCurrentUser
- src/app/pricing/page.tsx: page; guards: inspect delegated logic/public access
- src/app/purchasing/page.tsx: page; guards: getOperationalUser, getCurrentUser, hasRole
- src/app/reception/agenda/page.tsx: page; guards: getOperationalUser, getCurrentUser, branchScope
- src/app/reception/page.tsx: page; guards: getOperationalUser, getCurrentUser, hasRole
- src/app/reception/patients/page.tsx: page; guards: getOperationalUser, getCurrentUser, hasRole
- src/app/services/page.tsx: page; guards: inspect delegated logic/public access
- src/app/services/[slug]/page.tsx: page; guards: inspect delegated logic/public access
- src/app/supplier/page.tsx: page; guards: inspect delegated logic/public access

### Components and forms/actions

- src/app/about/page.tsx
- src/app/admin/AdminDashboardClient.tsx: form/action lines 151, 167, 183, 199, 222, 223, 234, 235, 246, 247, 258, 259, 387, 388, 580, 630, 632, 635
- src/app/admin/page.tsx
- src/app/appointments/request/page.tsx
- src/app/auth/login/LoginForm.tsx: form/action lines 73, 105, 109
- src/app/auth/login/page.tsx
- src/app/auth/register/page.tsx: form/action lines 96
- src/app/billing/BillingDeskClient.tsx: form/action lines 339, 370, 380, 395, 424, 445, 475, 530, 531, 541, 542, 552, 553, 563, 564, 581, 589, 593, 594, 688, 786, 865, 880, 931, 946, 971, 986, 1038
- src/app/billing/page.tsx
- src/app/book/page.tsx: form/action lines 258, 261, 314, 317, 351, 373, 375, 396, 399, 422, 428, 452, 454, 475, 478, 507, 513, 558, 562, 580, 587, 609, 611, 620, 622, 729, 735, 826, 833, 889, 891
- src/app/branches/page.tsx
- src/app/branches/[code]/page.tsx
- src/app/contact/page.tsx: form/action lines 109, 114
- src/app/crm/CrmDashboardClient.tsx: form/action lines 247, 259, 260, 265, 267, 409, 414, 421, 423, 492, 494, 497, 499
- src/app/crm/LeadActivity.tsx: form/action lines 7
- src/app/crm/page.tsx
- src/app/demo/page.tsx
- src/app/dentist/chart/[patientId]/DentistPatientChartClient.tsx: form/action lines 281, 290, 344, 345, 355, 356, 366, 367, 377, 378, 390, 400, 481, 487, 511, 597, 674, 736, 768, 774, 803, 809, 824, 889, 891, 897, 912, 945
- src/app/dentist/chart/[patientId]/page.tsx
- src/app/dentist/DentistDeskClient.tsx: form/action lines 213, 215, 227, 240, 253, 298, 300, 333, 352, 417, 418, 505, 507, 513, 515, 542, 544, 546, 553, 555, 577, 579, 582, 601, 603, 609, 648, 650, 653
- src/app/dentist/page.tsx
- src/app/dentist/[desk]/page.tsx: form/action lines 22, 23
- src/app/dentists/page.tsx: form/action lines 89, 91, 101, 104
- src/app/education/page.tsx: form/action lines 148, 150
- src/app/emergency/page.tsx
- src/app/faqs/page.tsx: form/action lines 79, 81, 105, 107
- src/app/inventory/InventoryDeskClient.tsx: form/action lines 529, 610, 611, 627, 628, 639, 640, 651, 652, 683, 684, 705, 818, 819, 858, 913, 923, 958, 1019, 1053, 1078, 1116, 1183, 1200, 1258, 1275, 1289, 1306, 1330, 1347, 1377, 1379, 1443, 1445, 1468, 1486, 1572, 1589, 1686, 1703, 1762
- src/app/inventory/page.tsx
- src/app/inventory/ReorderControls.tsx: form/action lines 39, 40
- src/app/inventory/StockWorkspace.tsx: form/action lines 35, 38, 39, 40
- src/app/layout.tsx
- src/app/management/ExecutiveReport.tsx: form/action lines 16
- src/app/management/InsightChart.tsx: form/action lines 11, 26, 27, 28
- src/app/management/ManagementClient.tsx: form/action lines 337, 340, 351, 353, 384, 385, 409, 410, 452, 454, 474, 475, 496, 497, 504, 505, 513, 514, 522, 523, 531, 532, 540, 541, 729, 782, 981, 1005
- src/app/management/OwnerCharts.tsx
- src/app/management/page.tsx
- src/app/new-patients/page.tsx
- src/app/operations/equipment/EquipmentDeskClient.tsx: form/action lines 324, 332, 371, 372, 383, 384, 395, 396, 427, 428, 473, 547, 554, 621, 704, 711, 744, 771, 789, 838, 856, 896, 913, 926, 944, 1012
- src/app/operations/equipment/page.tsx
- src/app/page.tsx: form/action lines 300, 302, 382, 383, 463, 1059, 1062, 1466, 1468, 1530, 1532
- src/app/policies/page.tsx: form/action lines 49, 50, 59, 60, 69, 70, 79, 80, 89, 90
- src/app/portal/appointments/page.tsx: form/action lines 107, 152, 224, 229
- src/app/portal/billing/page.tsx
- src/app/portal/billing/PortalSandboxPaymentButton.tsx
- src/app/portal/check-in/page.tsx
- src/app/portal/feedback/page.tsx
- src/app/portal/feedback/PortalFeedbackClient.tsx: form/action lines 116, 117, 133, 153, 155, 163, 165, 173, 175, 192, 195
- src/app/portal/intake/page.tsx: form/action lines 225, 227, 312, 315, 372, 375, 432, 435, 602, 604, 615, 617, 624, 626
- src/app/portal/page.tsx
- src/app/portal/PatientDashboardClient.tsx: form/action lines 179, 181, 196, 225, 226, 231, 232, 252, 311, 312, 317, 318
- src/app/portal/records/page.tsx
- src/app/pricing/page.tsx: form/action lines 73, 75
- src/app/purchasing/page.tsx
- src/app/purchasing/PurchasingWorkspaceClient.tsx: form/action lines 195, 196, 243, 330, 331, 356, 433, 435, 438, 457, 534, 536, 539
- src/app/reception/agenda/page.tsx: form/action lines 20
- src/app/reception/agenda/RequestInbox.tsx: form/action lines 175, 176, 186, 187, 224, 336, 366, 367, 385, 394, 397, 491
- src/app/reception/page.tsx
- src/app/reception/patients/page.tsx
- src/app/reception/ReceptionWorkspaceClient.tsx: form/action lines 449, 451, 461, 463, 516, 540, 542, 559, 561, 600, 602, 621, 623, 626, 628, 646, 648, 673, 675, 703, 705, 726, 730, 732, 749, 751, 764, 826, 828, 831
- src/app/services/page.tsx: form/action lines 101, 104
- src/app/services/[slug]/page.tsx
- src/app/supplier/page.tsx
- src/app/supplier/SupplierPortalClient.tsx: form/action lines 257, 259, 364, 366, 371, 373
- src/components/AppointmentRequestModal.tsx: form/action lines 23
- src/components/AppShell.tsx: form/action lines 233, 235, 244, 246, 264, 272, 278, 279, 293, 296, 312, 385, 387, 403, 478, 481, 500, 502, 512, 514, 551, 562, 572, 579, 580, 592, 593, 616, 630
- src/components/BookingNoticeModal.tsx
- src/components/charts/InteractiveCharts.tsx: form/action lines 75, 77, 87, 89, 99, 101
- src/components/clinical/ToothChart.tsx: form/action lines 129, 132, 273, 275, 311
- src/components/ClinicalPriorityControl.tsx: form/action lines 9
- src/components/DemoDataBanner.tsx
- src/components/FollowUpAction.tsx: form/action lines 5
- src/components/Footer.tsx: form/action lines 118, 120
- src/components/FrontDeskBook.tsx: form/action lines 6
- src/components/LocalizedControls.tsx
- src/components/LocalizedDate.tsx
- src/components/LocalizedText.tsx
- src/components/Navbar.tsx: form/action lines 115, 178, 209, 211, 245, 246, 269, 271, 276, 278, 295, 306, 319, 327, 339, 340, 349
- src/components/PageExperience.tsx
- src/components/PatientBooking.tsx: form/action lines 15, 16, 17, 18
- src/components/PatientRecords.tsx
- src/components/PresentationAccess.tsx: form/action lines 14, 16, 18
- src/components/QueuePolicySettings.tsx: form/action lines 33
- src/components/QuickDemoLogin.tsx: form/action lines 16, 17
- src/components/ReceptionBooking.tsx: form/action lines 47, 48
- src/components/ReceptionToday.tsx: form/action lines 40, 41, 42, 47
- src/components/TranslatedText.tsx
- src/components/ui/Alert.tsx
- src/components/ui/Badge.tsx
- src/components/ui/BrandLogo.tsx
- src/components/ui/Button.tsx: form/action lines 56
- src/components/ui/Card.tsx: form/action lines 16
- src/components/ui/EmptyState.tsx: form/action lines 38
- src/components/ui/PriorityIndicator.tsx
- src/components/ui/RolePageHeader.tsx
- src/components/ui/StatusBadge.tsx
- src/components/ui/StatusTag.tsx
- src/components/ui/WorkspaceEmblem.tsx
- src/context/LanguageContext.tsx

### Data models

- Branch
- Room
- User
- Session
- RoleGrant
- StaffProfile
- Patient
- PatientContact
- PortalPatientLink
- PatientCareAssignment
- PotentialDuplicateReview
- MedicalHistorySubmission
- MedicalHistoryReview
- DoctorDuty
- CoverageException
- SchedulingPolicy
- AppointmentRequest
- Appointment
- ArrivalEvent
- QueueEntry
- FollowUp
- Encounter
- ClinicalNoteAddendum
- ToothFinding
- TreatmentPlan
- TreatmentPlanItem
- DocumentMetadata
- ServiceCatalogItem
- Invoice
- InvoiceLine
- Payment
- PaymentAllocation
- InstallmentPlan
- Installment
- CashReconciliation
- Expense
- Material
- StockLot
- StockMovement
- StockTransfer
- Supplier
- PurchaseRequest
- PurchaseOrder
- PurchaseOrderLine
- GoodsReceipt
- GoodsReceiptLine
- EquipmentAsset
- EquipmentFault
- MaintenanceWorkOrder
- Notification
- FeedbackCase
- OperationalAlert
- AuditEvent
- PaymentAttempt
- InquiryActivity

### Service functions

- src/services/billing.service.ts: generateNextInvoiceNumber, generateNextReceiptNumber, getServiceCatalog, createInvoice, getPatientInvoices, recordPayment, getPatientPayments, createInstallmentPlan, recordCashReconciliation, recordExpense, getFinancialSummary
- src/services/booking.service.ts: availability, confirmBooking, submitBooking
- src/services/clinical.service.ts: createEncounter, updateEncounterDraft, finalizeEncounter, addClinicalAddendum, getEncounter, getPatientEncounters, recordToothFinding, getPatientToothChart, createTreatmentPlan, updateTreatmentPlanStatus, markTreatmentItemPerformed, getPatientTreatmentPlans, recordDocumentMetadata, getPatientDocuments, getPatientClinicalSummary
- src/services/communications.service.ts: createNotification, getUserNotifications, markNotificationRead, submitFeedbackCase, getFeedbackCases, assignFeedbackCase, respondAndResolveFeedback, generateOperationalAlerts, getOperationalAlerts, resolveOperationalAlert, getManagementActionCenterKPIs
- src/services/equipment.service.ts: getEquipmentAssets, getEquipmentAssetById, createEquipmentAsset, reportEquipmentFault, createWorkOrder, completeWorkOrder, verifyAndReturnToService, getEquipmentSummary, getWorkOrders
- src/services/intake.service.ts: saveIntakeDraft, submitIntake, reviewIntake, getPatientIntakeHistory
- src/services/inventory.service.ts: generateNextPONumber, getMaterialCatalog, createMaterial, getStockBalances, recordStockAdjustment, requestStockTransfer, shipStockTransfer, receiveStockTransfer, getSuppliers, createSupplier, createPurchaseOrder, receiveGoods, getStockTransfers, getPurchaseOrders, getGoodsReceipts, getStockMovements
- src/services/management.service.ts: getOperationalMetrics, getUnresolvedDuplicates, getPendingPortalLinks
- src/services/patient.service.ts: generateNextPatientNumber, createPatient, searchPatients, requestPortalPatientLink, verifyPortalPatientLink, resolveDuplicateReview
- src/services/payment.service.ts: postPayment
- src/services/scheduling.service.ts: createAppointmentRequest, reviewAppointmentRequest, patientRespondToAlternative, cancelAppointment, markAppointmentNoShow, reportPatientArrival, verifyArrivalAndAdmitToQueue, admitDirectWalkIn, callQueuePatient, startConsultation, completeConsultation, recordDoctorDuty, recordDoctorAbsence, rescheduleAppointment
- src/services/visit.service.ts: getQueuePolicy, checkIn, transitionVisit

## End-to-end acceptance gates

All seven user-requested continuous scenarios remain pending until individually exercised: inquiry to clinical visit; approved treatment to invoice and partial receipt; configured consumption to replenishment; management updates; CRM attendance funnel; security matrix; duplicate/concurrency/error handling. Existing automated suites are narrower evidence, not substitutes.

## Scope and integration blockers

No standalone lab/HR dashboard. No invented commission rules, material recipes or provider delivery. External messaging, payment gateway and AI require verified provider integration. Advanced imaging is distinct from ordinary file preview. Retain Passant and existing patient identity; no reset or monetary re-scaling.

## Verified repairs and evidence — 12 November 2026

| Change | Verification | Result |
|---|---|---|
| Restored local website and recovered existing PostgreSQL after interrupted shutdown | HTTP home, login and demo; browser sign-in to eight workspaces | Passed; no data reset or reseed |
| Added scripts/start-local.cjs and Start-Ebtesamty.cmd | Started stopped web server with existing database; reran while healthy | Passed; server runs independently in background |
| Owner chart hydration failure caused by multiple children inside SVG title | Diagnostic browser reproduced expected text-node mismatch; changed title to a single string; rebuilt and repeated browser test | Passed; no page errors on owner dashboard |
| Purchasing page branch isolation | Isolated user with BR-A inventory grant, unique purchase orders in two branches; inspect returned HTML including serialized props | Passed; own order present, other branch order absent |

New evidence: `work/website-recovery-check.json`, `work/recovery-*.png`, `work/parity-build.log`, `work/integration-test-output.txt`.

Executed checks:
- Production build succeeded. Existing lint warnings remain; no warning-free claim.
- 81 tests across 14 suites passed against the verification database.
- Eight demo role sign-ins and main dashboards returned 200 with zero captured page errors. At 390px, no document-width overflow. Captured desktop/mobile screenshots; visually inspected owner desktop and inventory mobile. This does not verify every dialog.
- `work/verify-royal-workflow.cjs`: private upload bytes and authorized download, reception download denial, custom invoice persisted, owner CRM/inventory/report access, reception CALL/NO_RESPONSE/RECALL/DISMISS and dentist CALL denial passed.
- `work/verify-receipt-confirm-stock.cjs`: both receive forms accepted current-day expiry, omitted completed lines, opened the correct Stock page, and showed usable stock 6 -> 8 -> 11; outstanding orders 5 -> 3 -> 0; reorder threshold and saved lead time passed.
- `work/verify-procurement-scope.cjs`: purchasing cross-branch record isolation passed.

### Remaining implementation and acceptance work

This delivery restores availability and repairs two verified defects; it does NOT implement complete DentoFlow parity. The module baseline above remains open. In particular: interactive chair calendar/drag-and-drop and earlier-opening waiting list; complete treatment approval-to-invoice linkage; pediatric/surface charting acceptance; configured case costs/commission rules; configured consumption recipes; advanced imaging; external messaging/payment/AI integrations; all seven continuous end-to-end scenarios; exhaustive endpoint permissions, exports, translations and mobile dialogs. Modules with some passing checks remain Partially Implemented until their complete acceptance criteria pass.

### Run locally

Open `C:\Ebtesamty\Start-Ebtesamty.cmd`, then visit http://localhost:3000 . The launcher checks readiness, starts the existing database and presentation website if necessary, and never seeds or resets records. Logs: `work/website-start.log` and `work/website-start-error.log`. This is a local service, not public hosting or an automatic Windows startup service.
