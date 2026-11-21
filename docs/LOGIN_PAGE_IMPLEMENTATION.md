# Login page implementation

Implemented in the original project on 2 November 2026.

The centered white card follows the supplied reference: icon, title, short subtitle, email/phone field, password field with accessible visibility control, full-width deep-teal Sign In button, two-column Quick Demo Role Login, expandable More Demo Roles, and patient registration link. The login route uses a compact brand/language header and omits the marketing footer. English and Arabic are supported.

Main roles: Hassan, Mariam, Dr. Sandy, Owner/Executive (Abram). Expanded roles: Finance, Inventory, CRM, Super Admin. Passant remains available through /demo and the presentation switcher. No Branch Manager button is restored.

Every demo submission creates a real server session. Both password and demo login resolve destinations from persisted role grants. Demo requests require ENABLE_DEMO_LOGIN=true, a localhost host, and a matching Origin. Production without that explicit setting hides the buttons and rejects the endpoint. Department accounts have dedicated FINANCE, INVENTORY, CRM and SYSTEM_ADMIN grants; Super Admin does not automatically receive clinical privileges. Existing misconfigured department demo grants were narrowed, with original grants backed up under work/login-data-backup and changes audited.

Passwords are not embedded in frontend code. Fictional accounts receive a randomly generated server-side password hash; use the local demo buttons. Password login remains available for configured accounts. Recovery is not implemented, so no nonfunctional Forgot Password link is shown.

Local launch commands:
- npm run demo:prepare: creates/migrates only ebtesamty_presentation; preserves existing populated data.
- npm run build, then npm run demo:start: fictional presentation at localhost:3000.
- npm run actual:start: original persisted database at localhost:3001, with demo bypass disabled.

Validation: all eight requested demo destinations authenticated successfully through HTTP; patient, dentist and finance accounts were denied the admin users API; foreign-origin demo login was rejected. Automated suite: 78 tests across 13 files passed before final UI verification. Further browser and password checks are recorded in DATA_INTEGRITY_AUDIT.md. Existing non-blocking image/hook lint warnings remain.
