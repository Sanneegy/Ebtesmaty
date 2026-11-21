# EBTESAMTY — COMPLETE 37-PAGE ROUTE & VISUAL AUDIT INVENTORY

This document provides a 100% comprehensive inventory of every single page route, dashboard, subpage, dynamic view, and authenticated workflow in **Ebtesamty (ابتسامتي)**. It catalogs route paths, product area mapping, visual design standards, photography assets, and redesign status.

---

## 1. Product Area & Route Matrix (37 Total Pages)

### Scope 1: Public Website & Informational (14 Routes)
| # | Route | Purpose | Key Visual Elements & Imagery | Redesign Status |
|---|-------|---------|-------------------------------|-----------------|
| 1 | `/` | Flagship Home | Editorial hero (`ebtesamty_official_logo.jpg`), floating finder, philosophy split, disciplines grid, protocols, pathway, branch cards (`branch_heliopolis.jpg`, etc.), doctor roster, interactive FAQ | ✅ Completed & Verified |
| 2 | `/services` | Clinical Services Overview | Category filter chips, 8 high-res clinical service banners (`service_cosmetic.jpg`, etc.), price badges in EGP piasters, step-by-step clinical protocols | ✅ Completed & Verified |
| 3 | `/services/[slug]` | Individual Procedure Detail | Full-width procedure hero, clinical candidacy checklist, procedure timeline (Preparation $\to$ Execution $\to$ Post-op), attending specialist cards with portraits, transparent EGP pricing | 🔄 In Progress |
| 4 | `/dentists` | Medical Faculty & Specialists | Filter by branch/specialty, genuine doctor portrait cards (`dr_sandy_saad.jpg`, etc.), credentials, clinical focus tags, direct booking trigger | ✅ Completed & Verified |
| 5 | `/branches` | Multi-Branch Clinic Network | High-res facility photos (`branch_heliopolis.jpg`, `branch_new_cairo.jpg`, `branch_maadi.jpg`), operatory counts, equipment specs, direct dial, mapped directions | ✅ Completed & Verified |
| 6 | `/branches/[code]` | Individual Branch Profile | Branch architectural hero, operatory capacity, sterility assurance badge, resident dentists roster with photos, operational hours, live queue snapshot link | 🔄 In Progress |
| 7 | `/about` | Philosophy, Team & Governance | Team photography (`about_team.jpg`), sterile safety protocols (`trust_sterilization.jpg`), 4 clinical governance pillars, Egypt dental license credentials | ✅ Completed & Verified |
| 8 | `/new-patients` | First Visit Guide & Journey | 4-step onboarding timeline, required documents checklist, digital intake preview card, anxiety-free dentistry reassurance, direct first-visit book CTA | 🔄 In Progress |
| 9 | `/emergency` | Urgent Care & Triage | High-contrast emergency banner, triage classification matrix (Urgent vs Non-Urgent), 3-branch direct emergency dispatch phones, first-aid visual guide | 🔄 In Progress |
| 10 | `/pricing` | Transparent Fees & Financing | Interactive category fee schedule, ValU / Sympl installment plan calculator, insurance partner cards, price guarantee policy | 🔄 In Progress |
| 11 | `/education` | Oral Health & Clinical Articles | Topic filters (implants, hygiene, ortho, pediatric), visual article cards with read times, author specialist tags with portrait thumbnails | 🔄 In Progress |
| 12 | `/faqs` | Searchable Patient FAQ | Category tabs, interactive search query box, rich accordion answers, consultation callout CTA | 🔄 In Progress |
| 13 | `/contact` | Multi-Branch Contact & Inquiries | Interactive branch cards with photos, direct WhatsApp/phone CTAs, interactive inquiry form, interactive Google Maps embed links | 🔄 In Progress |
| 14 | `/policies` | Compliance, Privacy & Booking Terms | Clean structured legal layout, cancellation policy matrix, data privacy compliance, zero-fabrication review charter | 🔄 In Progress |

---

### Scope 2: Public Booking & Authentication (4 Routes)
| # | Route | Purpose | Key Visual Elements & Imagery | Redesign Status |
|---|-------|---------|-------------------------------|-----------------|
| 15 | `/book` | Direct Slot Booking Flow | 4-step wizard: Branch selector $\to$ Specialist selector $\to$ Real-time slot calendar $\to$ Patient details & confirmation | ✅ Completed & Verified |
| 16 | `/appointments/request` | Quick Triage Appointment Request | Fast-track request form, branch preference, pain/symptom urgency selector, preferred time window | 🔄 In Progress |
| 17 | `/auth/login` | Secure Patient/Staff Login | Dual patient/staff authentication form, 1-click quick-demo credential switcher for all 6 core roles, branded midnight blue backdrop | 🔄 In Progress |
| 18 | `/auth/register` | New Patient Self-Registration | Multi-step form, Egyptian phone validation, household member support, instant portal access | 🔄 In Progress |

---

### Scope 3: Patient Portal Experience (6 Routes)
| # | Route | Purpose | Key Visual Elements & Imagery | Redesign Status |
|---|-------|---------|-------------------------------|-----------------|
| 19 | `/portal` | Patient Portal Dashboard | Next appointment banner with doctor portrait, treatment plan progress bar, active prescriptions, quick action cards | ✅ Completed & Verified |
| 20 | `/portal/appointments` | Appointment History & Upcoming | Visual appointment cards with doctor portraits, branch badges, reschedule modal, cancellation policy | 🔄 In Progress |
| 21 | `/portal/billing` | Billing, Invoices & Receipts | Branded fee breakdown, invoice status tags (Paid, Partial, Unpaid), printable/downloadable itemized receipt card, ValU installments | 🔄 In Progress |
| 22 | `/portal/check-in` | Mobile Fast-Track Arrival | GPS branch arrival confirmation card, queue position tracker, waiting time estimate, intake completion check | 🔄 In Progress |
| 23 | `/portal/intake` | Digital Medical History Intake | 4-step medical form: Systemic conditions, allergies, medications, dental anxiety index with safety indicators | 🔄 In Progress |
| 24 | `/portal/feedback` | Verified Post-Visit Review | Verified encounter feedback form, 5-star clinical & hospitality rating, doctor compliment selector, zero-fabrication notice | 🔄 In Progress |

---

### Scope 4: Clinical & Front Desk Dashboards (4 Routes)
| # | Route | Purpose | Key Visual Elements & Imagery | Redesign Status |
|---|-------|---------|-------------------------------|-----------------|
| 25 | `/reception` | Front Desk & Queue Operations | Real-time arrival queue, branch switcher (`BR-A`, `BR-B`, `BR-C`), fast patient search, walk-in triage modal, status badges | ✅ Completed & Verified |
| 26 | `/reception/agenda` | Multi-Doctor Operatory Schedule | Operatory & doctor time grid, color-coded appointment statuses, quick reschedule drag-and-drop or slot click | 🔄 In Progress |
| 27 | `/dentist` | Clinical Workstation & Day Queue | Assigned patient queue, quick triage notes, encounter launcher, active treatment plan summaries | ✅ Completed & Verified |
| 28 | `/dentist/chart/[patientId]` | Odontogram & Clinical Records | Interactive 32-tooth odontogram (surface-level restorative mapping), periodontal chart, SOAP clinical notes, treatment plan builder | 🔄 In Progress |

---

### Scope 5: Operational & Management Dashboards (9 Routes)
| # | Route | Purpose | Key Visual Elements & Imagery | Redesign Status |
|---|-------|---------|-------------------------------|-----------------|
| 29 | `/management` | Executive / Consolidated Dashboard | Multi-branch KPI cards, interactive SVG revenue & visit charts, branch comparison table, doctor productivity matrix | ✅ Completed & Verified |
| 30 | `/billing` | Finance & Accountant Desk | Interactive revenue bar chart, collection breakdown donut chart, aging receivables list, payment receipts | ✅ Completed & Verified |
| 31 | `/inventory` | Central & Branch Inventory Desk | Stock level status bars, low-stock alerts, interactive monthly consumption line chart, branch transfer modal | ✅ Completed & Verified |
| 32 | `/purchasing` | Procurement & Purchase Orders | Requisition workflow (`DRAFT` $\to$ `ORDERED` $\to$ `RECEIVED`), supplier status cards, batch number logs | 🔄 In Progress |
| 33 | `/crm` | Marketing, Retention & Recall | Interactive recall funnel SVG chart, retention campaign cards, 6-month hygiene recall triggers, patient satisfaction score | ✅ Completed & Verified |
| 34 | `/operations/equipment` | Operatory Equipment & Autoclave | Class-B autoclave cycle log, dental chair maintenance alerts, digital sensor calibration records | 🔄 In Progress |
| 35 | `/admin` | Super Admin & Clinic Configuration | User role & branch assignment matrix, procedure price book editor, system audit logs viewer | ✅ Completed & Verified |
| 36 | `/supplier` | Supplier Catalog & Orders | Catalog items with wholesale prices, order status tracker, delivery ETA cards | 🔄 In Progress |
| 37 | `/demo` | Multi-Role Demo Switcher | Visual persona cards for all 6 demo accounts with quick 1-click switch buttons and pre-loaded test data | 🔄 In Progress |

---

## 2. Design System Enforcements Across All 37 Routes
1. **Palette Harmony:**
   - Deep Teal (`#176C5B`) for active navigation, primary CTAs, positive clinical badges.
   - Midnight Blue (`#163447`) for headings, strong structural containers, top navigation bars.
   - Warm Ivory (`#F7F8F5`) for calm page backgrounds and reading surfaces.
   - Soft Mint (`#E3F0EB`) for secondary tags, subtle highlight cards, active states.
   - Surface White (`#FFFFFF`) for elevated cards, forms, tables, modals.
   - Muted Terracotta (`#D58B57`) strictly for decorative accents and urgent badges.

2. **Visual Imagery Integration:**
   - No placeholder grey boxes or letter initial icons where photos exist.
   - All doctor references must link or display actual doctor photos (`dr_sandy_saad.jpg`, `dr_feby_samer.jpg`, `dr_ahmed_hassan.jpg`, `dr_youssef_elmansy.jpg`, `dr_nadia_elhariry.jpg`).
   - All branch references must display actual branch architecture photos (`branch_heliopolis.jpg`, `branch_new_cairo.jpg`, `branch_maadi.jpg`).
   - All clinical services must feature clinical procedure photos (`service_cosmetic.jpg`, etc.).

3. **Financial Consistency:**
   - Egyptian Pounds (`EGP`) stored in integer minor units (piasters = EGP $\times$ 100).
   - Display formatted with `tabular-nums` on all financial figures and tables.
