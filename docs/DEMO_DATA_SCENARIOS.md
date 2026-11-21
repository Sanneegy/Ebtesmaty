# Fictional demonstration scenarios

All records in database ebtesamty_presentation are fictional. A persistent bilingual banner distinguishes this database from original application records. No dashboard receives its own dataset. The original ebtesamty database is not reseeded; its patients, visits, clinical notes and financial records remain intact.

The initial reporting period is 3 October–2 November 2026, saved in FICTIONAL_DEMO_INITIALIZED. Dates are anchored once at creation using Africa/Cairo, not changed each time a dashboard loads. Future appointment availability covers 30 days after initialization. A presentation reused beyond that period needs deliberately planned new availability, not silently rewritten history.

Nine unique fictional patients: Hassan Ali, Passant, Nour Mansour, Layla Mahmoud, Omar Nabil, Mona Adel, Youssef Khalil, Farida Samir and Karim Amin. Passant's fictional account is separate from her original database record.

## Hassan Ali, DEMO-PAT-001

Hassan's website request demo-request-hassan-first belongs to Branch A. Its appointment, verified arrival, completed queue entry and finalized encounter all reference the same patient. Reception verifies arrival before the consultation; the dentist finalizes care before invoicing; payment follows invoice creation.

Root canal care performed: EGP 3,000. Invoice DEMO-INV-hassan-first: EGP 3,000. A fictional card attempt for EGP 1,500 fails and creates no payment or allocation. A successful EGP 1,500 payment is allocated once to that invoice. Outstanding balance: EGP 1,500.

A zirconia crown remains PLANNED, estimated at EGP 3,500, and is not invoiced or counted as completed care. His subsequent review is confirmed two days after the anchor date. The follow-up and resolved CRM inquiry link to Hassan's existing patient ID. Portal billing, clinical records and owner reports use those same records.

## Other journeys

- Nour, Branch B: telephone booking, completed consultation, fully paid EGP 900.
- Layla, Branch C: WhatsApp-originated booking, completed visit, fully paid EGP 600.
- Omar, Branch A: walk-in during available capacity, completed care, fully paid EGP 1,200.
- Mona, Branch B: website booking, completed care, EGP 900 invoice, EGP 450 paid, EGP 450 outstanding; linked open complaint.
- Youssef, Branch C: telephone booking, completed consultation, EGP 600 outstanding.
- Farida: cancelled appointment without arrival, plus a separate future WhatsApp request awaiting confirmation. These are two legitimate dated events, not duplicate appointments.
- Karim: previous no-show at Branch C without arrival; separate fictional after-hours emergency assessment at Branch A, with verified arrival and WAITING queue entry, assigned to Dr. Feby. An explicit demonstration duty provides capacity at initialization. Waiting status is never created for a patient who has not arrived. It remains a stored scenario, not an automatically advancing live simulation.
- Passant: future confirmed visit at Branch B, with no fabricated arrival, clinical encounter or charge.

All booking channels share AppointmentRequest and Appointment. CRM conversion follows those request-to-appointment links; it does not copy patient identities. There is no separate unconnected lead dataset.

## Reconciliation

| Branch | Invoiced EGP | Posted collections EGP | Outstanding EGP |
|---|---:|---:|---:|
| A | 4,200 | 2,700 | 1,500 |
| B | 1,800 | 1,350 | 450 |
| C | 1,200 | 600 | 600 |
| All | 7,200 | 4,650 | 2,550 |

Inventory: three fulfilled purchase orders and receipts introduce 40, 25 and 8 boxes of gloves. A traceable transfer moves five boxes from A to C. Seven boxes are consumed in C. Final balances: A 35, B 25, C 6. Every balance reconciles to signed movements; C is below the reorder threshold of 10.

No external payment provider is contacted. Payment attempts are explicitly fictional persisted records, not claims of a live integration. No refund is invented; a complete refund-processing workflow remains outside the currently implemented application behavior.
