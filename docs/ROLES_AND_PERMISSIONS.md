# Ebtesamty — Roles & Permissions Matrix (RBAC)

## 1. Security & Access Control Principles
1. **Server-Side Enforcement**: Every API endpoint (`src/app/api/**`) and server page validates the session token (`ebtesamty_session` HTTP-only cookie) and checks role/branch grants via `requireRole`, `assertBranchAccess`, `assertCareAssignment`, and `assertPatientSelf` in `src/lib/rbac.ts`.
2. **Least Privilege & Clinical Privacy**:
   - Receptionists can register patients, manage appointments/queues, verify portal links, and collect checkout payments, but **cannot** view or edit clinical encounter notes, odontogram findings, or medical intake questionnaire answers.
   - Dentists can access clinical records, odontograms, medical intakes, and treatment plans for patients under their care assignment or branch schedule.
   - Patients can only access their own `APPROVED` linked patient record (`PortalPatientLink`).
3. **Consolidated Executive Oversight**: There is **no separate Branch Manager dashboard**. The `OWNER_ADMIN` (and authorized executive/operations users) use the unified **Owner / Executive Management** dashboard (`/management`) with branch drill-down (`All Branches`, `BR-A`, `BR-B`, `BR-C`).

---

## 2. Role-to-Dashboard & Capability Matrix

| Capability / Module | Public Visitor | Patient (`PATIENT`) | Receptionist (`RECEPTIONIST`) | Dentist (`DENTIST`) | Finance / Billing (`FINANCE` / `BRANCH_MANAGER`) | Inventory & Procurement (`INVENTORY` / `BRANCH_MANAGER`) | Marketing & CRM (`RECEPTIONIST` / `OWNER_ADMIN`) | Owner / Executive (`OWNER_ADMIN`) | Super Admin (`OWNER_ADMIN`) |
|---|---|---|---|---|---|---|---|---|---|
| **Public Website & Booking Request** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Patient Portal (`/portal`)** | ❌ | ✅ Own Linked Record | ❌ | ❌ | ❌ | ❌ | ❌ | 🔍 Demo/Audit | 🔍 Demo/Audit |
| **Receptionist Desk (`/reception`)** | ❌ | ❌ | ✅ Assigned Branch | ❌ | ❌ | ❌ | ✅ Inquiry Follow-up | ✅ All Branches | ✅ All Branches |
| **Clinical Workspace (`/dentist`)** | ❌ | ❌ | ❌ (403 Blocked) | ✅ Assigned Patients | ❌ (403 Blocked) | ❌ (403 Blocked) | ❌ (403 Blocked) | ✅ Clinical Oversight | ❌ (Explicit Clinical Grant) |
| **Medical Intake Answers & Odontogram** | ❌ | ✅ Own Record | ❌ (403 Blocked) | ✅ View & Sign-Off | ❌ (403 Blocked) | ❌ | ❌ | ❌ (Zero-PHI KPIs) | ❌ (Zero-PHI Audit) |
| **Owner / Executive Dashboard (`/management`)** | ❌ | ❌ | ❌ | ❌ | ✅ Branch KPIs | ❌ | ❌ | ✅ Consolidated + Drill-down | ✅ Full |
| **Finance & Accounting (`/billing`)** | ❌ | ✅ Own Invoices (`/portal/billing`) | ✅ Checkout Collection | ❌ | ✅ Full Ledger & Recon | ❌ | ❌ | ✅ Full Financial BI | ✅ Full |
| **Inventory & Procurement (`/inventory`, `/purchasing`)** | ❌ | ❌ | ❌ | 🔍 View Chairside Stock | ❌ | ✅ Lots, Transfers, POs | ❌ | ✅ Stock Alerts & Valuation | ✅ Full |
| **Marketing, CRM & Retention (`/crm`)** | ❌ | ❌ | ✅ Inquiries & Recalls | ✅ Create Recall Tasks | ❌ | ❌ | ✅ Full CRM & Campaigns | ✅ Conversion Analytics | ✅ Full |
| **Super Admin & Config (`/admin`)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Full Config & Audit | ✅ Users, RBAC, Pricing, Audit |

---

## 3. Pre-Seeded Demonstration Accounts (`/demo`)

All local development accounts use password `Password123!` and are strictly restricted to non-production environments (`NODE_ENV !== 'production'`):

| Persona | Full Name | Email | Role Grant | Branch Scope | Primary Workspace |
|---|---|---|---|---|---|
| **Owner / Super Admin** | Clinic Administrator | `admin@ebtesamty.dev` | `OWNER_ADMIN` | All Branches (`BR-A`, `BR-B`, `BR-C`) | `/management` & `/admin` |
| **Executive / Operations** | Amr Fouad | `manager.b1@ebtesamty.dev` | `BRANCH_MANAGER` | `BR-A` (Heliopolis) | `/management`, `/billing`, `/inventory`, `/crm` |
| **Dentist 1 (Branch A)** | Dr. Sandy Saad | `dr.sandy@ebtesamty.dev` | `DENTIST` | `BR-A` (Heliopolis) | `/dentist` |
| **Dentist 2 (Branch A)** | Dr. Feby Samer | `dr.feby@ebtesamty.dev` | `DENTIST` | `BR-A` (Heliopolis) | `/dentist` |
| **Dentist 1 (Branch B)** | Dr. Ahmed Hassan | `dr.ahmed@ebtesamty.dev` | `DENTIST` | `BR-B` (New Cairo) | `/dentist` |
| **Dentist 2 (Branch B)** | Dr. Youssef El-Mansy | `dr.youssef@ebtesamty.dev` | `DENTIST` | `BR-B` (New Cairo) | `/dentist` |
| **Dentist 1 (Branch C)** | Dr. Nadia El-hariry | `dr.nadia@ebtesamty.dev` | `DENTIST` | `BR-C` (Maadi) | `/dentist` |
| **Receptionist (Branch A)** | Mariam Hanna | `mariam.reception@ebtesamty.dev` | `RECEPTIONIST` | `BR-A` (Heliopolis) | `/reception` |
| **Receptionist (Branch B)** | Sandy Abd | `sandy.reception@ebtesamty.dev` | `RECEPTIONIST` | `BR-B` (New Cairo) | `/reception` |
| **Receptionist (Branch C)** | Salma Adel | `salma.reception@ebtesamty.dev` | `RECEPTIONIST` | `BR-C` (Maadi) | `/reception` |
| **Patient (Verified Link)** | Hassan El-Sayed | `hassan.patient@ebtesamty.dev` | `PATIENT` | Linked to `EBT-PAT-2026-0001` | `/portal` |
| **Patient (Pending Link)** | Nour Mansour | `nour.patient@ebtesamty.dev` | `PATIENT` | Pending link to `EBT-PAT-2026-0004` | `/portal` |
| **Patient (Draft Intake)** | Layla Mahmoud | `layla.patient@ebtesamty.dev` | `PATIENT` | Linked to `EBT-PAT-2026-0007` | `/portal` |
