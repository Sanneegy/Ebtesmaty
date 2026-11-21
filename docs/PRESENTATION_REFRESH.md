# Presentation refresh — 2 November 2026

Changed the original project in C:\Ebtesamty. A pre-change source backup is in work/presentation-backup/src.

## Delivered
- Local presentation switcher at /demo and a persistent Presentation access button. One POST opens an allowlisted saved account. Explicit ENABLE_DEMO_LOGIN flag, loopback host restriction, same-origin check, active account check, fixed destination routes. No password entry is required. Includes Passant, Abram, all five dentists, three receptionists, finance, inventory, CRM and system administration.
- Renamed the existing Passant user and linked patient record to Passant; renamed the existing owner user to Abram. Other account names and patient history were preserved. Main database was not reseeded.
- Patient appointment modal now loads real availability by branch, dentist, service and Cairo date, and submits selectedSlotTime. It displays request status separately from confirmed appointment status, uses an inline error, and shows a success notice. Raw validation JSON is no longer returned for malformed booking forms.
- Cairo calendar-date normalization corrected for doctor duty/absence and appointment confirmation across midnight.
- Central Arabic copy catalog and React translation components cover over 1,300 interface instances, including server-rendered pages, billing, all intake steps, placeholders, dashboard tables, chart labels and state labels. Original names and patient-entered notes are preserved; they are not machine-translated.
- Shared page-specific workspace headers, role color accents, Manrope / IBM Plex Sans Arabic typography, teal primary navigation, larger statuses with icons, hover/focus feedback, and reduced-motion support. Missed visits are red, overdue arrivals amber, confirmed/completed states green. Financial and executive views retain distinct midnight-blue structure.

## Validation
- 75 automated tests passed across 12 files, using the isolated verification database.
- TypeScript checking passed.
- Browser verified one-click Passant and Mariam access; Abram owner login; Arabic portal billing; intake steps 1–4; live slot selection; saved request; reception confirmation.
- A clearly labeled presentation test request was created for Passant and confirmed by Mariam with Dr. Sandy on 2 November 2026 at 10:00, BR-A. This demonstration booking remains in the original database.
- Build completed with existing image-optimization and effect-dependency warnings. No visual claim of exhaustive interaction coverage: not every modal/data-dependent state was exercised in the browser.

## Operation
Open http://localhost:3000/demo for the presentation. Use the floating switcher to change roles from any page. Presentation access is deliberately local and can be disabled by setting ENABLE_DEMO_LOGIN=false in .env.local and restarting the server.
