# Ebtesamty — Integrations & Configuration Guide

## 1. Environment Variables (`.env`)

| Variable | Required | Default / Dev Value | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://ebtesamty:...@localhost:5432/ebtesamty?schema=public` | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | 32+ char random string | Session token signing & security |
| `NODE_ENV` | Yes | `development` \| `test` \| `production` | Controls demo switcher visibility & cookie security |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Canonical base URL for SEO metadata & sitemaps |
| `SMTP_HOST` | Optional | `localhost` | Outbound email server (Mailpit in dev) |
| `SMTP_PORT` | Optional | `1025` | Outbound SMTP port |
| `SMTP_FROM` | Optional | `noreply@ebtesamty.com` | Sender address for appointment & account emails |
| `WHATSAPP_API_TOKEN` | Optional | Not set (Sandbox Mode) | WhatsApp Business API token for reminders |
| `PAYMENT_GATEWAY_SECRET` | Optional | Not set (Sandbox Mode) | Online payment provider verification key (Paymob/Fawry) |

---

## 2. Integration Architecture & Honest Status Handling

Ebtesamty isolates external providers behind modular service boundaries (`src/services/communications.service.ts` and `src/services/billing.service.ts`) and reports honest connection statuses in the **Super Admin (`/admin`)** dashboard:

1. **In-App Notifications (`Notification` table)**:
   - **Status**: **LIVE (Database-Backed)**.
   - Triggers on booking requests, confirmations, alternative slot proposals, cancellations, payment receipts, and feedback responses.
2. **Email Delivery (SMTP / Mailpit)**:
   - **Status**: **CONFIGURABLE (`SMTP_HOST` / `SMTP_PORT`)**.
   - Ready for local Mailpit capture (`localhost:1025`) or production SMTP relay.
3. **WhatsApp Business & SMS Gateways**:
   - **Status**: **SANDBOX / TEMPLATE MODE** until `WHATSAPP_API_TOKEN` is supplied.
   - Generates pre-formatted bilingual Arabic/English WhatsApp confirmation and recall links (`https://wa.me/...`) for receptionist one-click dispatch without falsely claiming automated background delivery when credentials are absent.
4. **Online Payment Processing (InstaPay / Fawry / Card POS)**:
   - **Status**: **SANDBOX VERIFICATION MODE** with strict server-side `idempotencyKey` protection.
   - Portal patients and receptionists can record payments in sandbox/demo mode with full transaction ledger allocation (`Payment` + `PaymentAllocation`) and duplicate-prevention checks.
5. **Maps & Branch Directions**:
   - **Status**: **LIVE (Branch-Specific Coordinates)**.
   - Each branch (`BR-A` Heliopolis, `BR-B` New Cairo, `BR-C` Maadi) links to its distinct Cairo location rather than a generic pin.
6. **Calendar Export (`.ics`)**:
   - **Status**: **LIVE**.
   - Patients can download standard iCalendar `.ics` files immediately after booking or from the patient portal.
