# Ebtesamty — Semantic Actions and Statuses (internal implementation guidance)

This document is **not rendered in the application**. The colors and icons are present only where an operational action or state warrants them.

| Meaning | Treatment | Example |
|---|---|---|
| Main create/navigate action | Blue fill + icon | New Appointment, Open Chart |
| Confirmed successful state or actual verification | Subtle green tint + check icon | Confirm Arrival, Completed, Paid |
| Waiting / needs attention | Subtle amber + clock icon | Waiting, Intake Pending |
| Critical / destructive action | Subtle red + x / alert icon | Cancel Appointment, serious hazard |
| Planned, future only | Muted violet chip | Proposed Treatment, Plan |
| Informational/neutral | Gray border, blue text/icon if link | Print Receipt, Checkout Navigation, Scheduled |

Operational principles:
1. **Do not color a future payment estimate as overdue**; use due labels only when verified.
2. **Self-reported arrival is not a verified check-in**; reception must confirm presence.
3. **Checkout is not a proposed clinical plan**; it uses neutral treatment, or amber where attention is needed.
4. **In treatment is active blue**, not completed green.
5. Colors are accompanied by labels and icons, not relied on exclusively.
6. Show only one strongly filled primary button per action group.
7. Do not display a color key / palette / design-guidelines section to patients or staff.
8. No role can see clinical notes unless authorized. This update does not change role guards or the Prisma schema.

Change scope: shared Button/Badge/StatusTag primitives; Reception stage pills, stat tone and workflow buttons; Patient portal request/cancellation actions; Dentist workspace buttons; low-contrast visual foundation for all dashboards.
