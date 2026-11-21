# Role, flow and UX verification

Date: 1 November 2026. Changes made directly in C:\Ebtesamty.

## Executed checks

| Check | Result | Scope |
|---|---|---|
| TypeScript | PASS | tsc --noEmit --incremental false |
| ESLint | PASS with warnings | next lint; existing image optimization and effect dependency warnings remain |
| Production build | PASS | next build compiles and generates all routes; final rerun after chart corrections succeeded |
| Automated suite | PASS: 71 tests in 11 files | npm run test:isolated; isolated PostgreSQL database ebtesamty_ux_verification |
| Additive migrations | PASS | Role/source/policy fields; reschedule linkage; arrival exception note. Main clinic database was not reseeded |
| Shared-phone identity | PASS automated | Two household members remain distinct; duplicate hint is created |
| Concurrent booking | PASS automated | Two confirmations competing for one slot yield one success |
| Reception-only check-in | PASS automated | Patient rejected; concurrent staff retry returns one verified visit; actor recorded |
| Visit lifecycle | PASS automated | Call required before treatment; reception cannot start clinical treatment; completion timestamp stored |
| Queue fairness | PASS automated | Earlier appointment before early-arriving later slot; arrival tie-break and clinical priority ordering |
| Branch financial reconciliation | PASS automated | Selected-branch executive billed/collected totals match financial report |
| Financial concurrency | PASS automated | Competing payments cannot overpay one invoice; exact minor-unit balance remains |
| Stock concurrency | PASS automated | Competing deductions cannot produce a negative balance |
| Clinical records | PASS existing suite | Finalized note protection and addenda; no comprehensive adversarial API matrix claimed |
| Locale/date formatting | PASS automated | Cairo winter/summer conversion and EN/AR keys for new workflow catalog |
| Browser booking | PASS observed | EN/AR toggle; Arabic remains after reload; branch/service controls visible |
| Browser reception | PASS observed | Seeded receptionist sign-in; Arabic daily appointments/queue/request tables; booking form and role-specific navigation render |

The older tests were updated where the required behavior intentionally changed: patient self-arrival is rejected, consultation requires a call first, alternative slots require actual duty, and invoice/receipt identifiers are collision-resistant. No failed test was hidden or skipped. Test data is synthetic and separate from existing clinic records.

## Reproduce

Run npm run typecheck, npm run lint, npm run test:isolated and npm run build. The isolated runner derives connection credentials from the local .env without printing them, overrides only the database name, and runs tests serially. Its database must be migrated and seeded beforehand. work/prepare-test-database.cjs was used for that setup; it seeds only ebtesamty_ux_verification. The normal npm test command also uses this isolated runner. A database guard rejects Vitest against a differently named configured database.

## Browser and acceptance limits

No full mobile/desktop screenshot matrix or all-role end-to-end suite has been completed. Browser checks used existing seeded local accounts and read-only page/form inspection; new business records were not submitted through the live clinic UI. Unit key parity is not a full translation audit. Legacy dashboard translation, complete chart/filter reconciliation, secure document release, payment-provider integration, full accessibility measurements and dependency-advisory triage remain open. See UX_FUNCTIONALITY_AUDIT.md for precise limitations.
