# Data integrity audit

Audit command: npm run data:audit. Machine-readable evidence: docs/data-audit-results.json. This is an executable reconciliation of persisted records, not a visual assertion that dashboards look populated.

Checks cover repeated patient identifiers and identity candidates, repeated appointment slots, future birth dates, appointment/request identity and branch consistency, absence of arrival for cancelled/no-show visits, completed appointments linked to encounters, encounter identity, invoice line totals, posted allocations versus invoice paid amounts, cross-patient allocations, payment overallocation, treatment estimate totals and performed encounter references, stock lots versus movements, paired transfers, department role grants, payment attempt links, and branch-to-consolidated financial sums.

## Fictional presentation

The initial isolated dataset passed these checks with zero findings. Its nine patients share one persisted data layer across the application. Invoiced 720,000 piasters; posted collections 465,000 piasters; outstanding 255,000 piasters. Failed attempts do not affect these totals. Subsequent presentation interactions will legitimately change operational counts; rerun the audit to capture that state.

## Original database: findings preserved for review

The original database contains 10 patient records. Existing issues include one future birth date, five completed appointments without linked encounters, one encounter without a linked appointment, and 12 stock lots with balances but no corresponding opening ledger movements. These records were not rewritten or deleted. A truthful correction requires the correct birth date, clinical linkage evidence, and confirmed opening stock balances; inventing those facts would make the audit less reliable.

Four known department demo accounts previously held OWNER_ADMIN. Their grants were narrowed to their respective functional roles and the changes were audited. Before-change grant metadata is saved in work/login-data-backup/department-grants.json. Actual clinical and financial records were not changed.

## Prevention added

Public, portal and reception booking forms send stable submission identifiers. The server locks concurrent retries and validates a payload hash before reusing the same request. Same-phone guest patients are never silently merged. Egyptian phone formats are normalized for new records and configured account lookup. Registration creates suspected-duplicate review hints. Patient references now use a database sequence instead of count-plus-one, avoiding concurrent collisions.

Goods receipts use stable submission references, validate payload reuse and remaining purchase-order quantities, and serialize receipt processing per order. Transfers already serialize transitions and record paired movements. Payments already use atomic invoice allocation and unique idempotency keys. Failed provider attempts now have a separate persisted model and cannot be mistaken for posted collections. Portal balance calculations exclude draft/voided invoices and use actual allocated invoice balances.

Reception-facing finance and CRM server pages now respect branch scope. Demo destinations derive from server role grants. Super Admin has explicit configuration permissions rather than universal owner privileges. No excluded dashboard was added.

## Validation and limits

78 automated tests across 13 files passed, including new concurrent guest retry and role-routing checks. Production build passed with existing non-blocking image and hook warnings. HTTP checks verified all eight requested demo sessions/destinations and rejected cross-origin authentication and unauthorized admin access. See the final verification record below for subsequent checks.

This is not a claim of a complete forensic audit of every historical note or every possible duplicate. Phone/name similarity requires human review, not automatic merging. The current application has no password recovery flow, no live payment-provider integration, and no complete auditable refund workflow. Those are not simulated as functioning integrations. CRM inquiry attribution uses appointment requests and existing patient links; there is no independent marketing lead conversion integration. Historical original-data inconsistencies remain explicitly unresolved.

## Final verification, 2 November 2026

- Production build completed successfully after the permission, receipt and balance fixes.
- Isolated HTTP verification passed patient registration and approved patient linking, incorrect-password rejection, uppercase-email login, configured-phone login, authenticated portal access, logout invalidation, production demo endpoint rejection and hidden demo controls.
- Browser verification passed the restored English desktop card, Arabic RTL card at 390 × 844, expandable additional roles and password visibility. Mobile document width equalled viewport width (385 CSS pixels excluding the scrollbar), with no horizontal overflow.
- The presentation launcher binds to 127.0.0.1. It is a local presentation environment, not a public authentication bypass.
- Separate fictional failed/successful payment attempts reconcile to Hassan's invoice and posted payment. The live waiting example is a separately identified fictional emergency visit with explicit capacity and verified arrival.
- Screenshots are saved under work/login-restored-desktop.png and work/login-restored-mobile-ar.png.
