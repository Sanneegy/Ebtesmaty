# Ebtesamty Production Readiness & Go-Live Checklist (Egypt)

**Document Classification:** Clinical Compliance & Security Engineering  
**Target Market:** Arab Republic of Egypt (Multi-Branch Dental Healthcare Provider)

---

## 1. Executive Summary

Phase 01 delivers a robust, secure, and fully verified architectural foundation for Ebtesamty Dental Clinics. However, **before deploying this application to serve real Egyptian dental patients in live clinical operations**, several critical legal, regulatory, security, and medical prerequisites must be fulfilled.

Deploying live healthcare software without these controls poses legal liability under Egyptian law, ethical risks to patient safety, and clinical liability for treating practitioners.

---

## 2. Egyptian Legal & Regulatory Go-Live Blockers

### 2.1 Egyptian Personal Data Protection Law (Law No. 151 of 2020)
- [ ] **Data Protection Officer (DPO):** Appoint and register an official DPO with the Egyptian Data Protection Center (PDPC).
- [ ] **Sensitive Personal Data Licensing:** Health data is classified as *Sensitive Personal Data* under Law 151. Obtain formal processing permits from the PDPC for electronic health records (EHR).
- [ ] **Data Residency:** All databases containing personal health information (PHI) of Egyptian citizens must reside within servers physically hosted inside the borders of the Arab Republic of Egypt, or within PDPC-certified sovereign cloud regions (e.g., Telecom Egypt / WE Regional Cloud, Huawei Egypt Cloud, or certified sovereign Azure/AWS local zones).
- [ ] **Cross-Border Transfer Restrictions:** Verify that no database backups, error telemetry, or analytics logs transmit unencrypted patient identifiers outside Egypt.

### 2.2 Ministry of Health and Population (MoHP) & Dental Syndicate Compliance
- [ ] **Private Healthcare Establishment Licensing:** Ensure all three clinic branches possess valid licenses under Law No. 51 of 1981 (as amended by Law No. 153 of 2004).
- [ ] **Syndicate Question Set Certification:** Submit the medical intake question catalog to a clinical board of the Egyptian Dental Syndicate (نقابة أطباء الأسنان) for formal endorsement, verifying that all relevant local medical contraindications (e.g., Hepatitis C/B prevalence, common local anticoagulant regimens, sickle cell, diabetes screening thresholds) are properly addressed.
- [ ] **Clinician License Verification:** Enforce automated check of dentist syndicate registration numbers (`licenseNumber`) against the official Syndicate registry before granting `DENTIST` signing authority.

### 2.3 Legal Guardianship & Minor Consent Policies
- [ ] Under Egyptian Civil Code, medical consent for minors under the age of 21 (or 18 for non-invasive outpatient dental examinations) must be legally executed by a father, natural guardian, or court-appointed custodian.
- [ ] **Pre-Production Requirement:** Expand the medical intake submission workflow to enforce digital capture of the legal guardian's full name, national ID, relationship to patient, and explicit legal consent disclaimer for pediatric patients.

---

## 3. Infrastructure & Security Hardening Prerequisites

### 3.1 Network & Infrastructure Architecture
- [ ] **Database Encryption at Rest:** Enable AES-256 transparent data encryption (TDE) on PostgreSQL disk volumes (e.g., LUKS volume encryption or cloud managed encrypted storage).
- [ ] **TLS 1.3 Termination:** Enforce HTTPS with strict HSTS (`max-age=31536000; includeSubDomains; preload`) and disable legacy TLS versions (< 1.2).
- [ ] **Branch Network IP Allowlisting:** Restrict receptionist and dentist dashboard access to static branch VPN/WAN IPs to prevent external unauthorized access to clinical administrative routes.

### 3.2 Staff Authentication & Credential Security
- [ ] **Mandatory Multi-Factor Authentication (MFA):** Implement TOTP (Time-based One-Time Password via Google Authenticator or Microsoft Authenticator) for all `RECEPTIONIST`, `DENTIST`, `BRANCH_MANAGER`, and `SYSTEM_ADMIN` accounts.
- [ ] **Session Idle Lockdown:** Enforce client-side screen blanking and session lock after 10 minutes of inactivity on shared operatory/reception desktop terminals.
- [ ] **Centralized Identity & Offboarding:** Integrate clinic Active Directory / LDAP or Okta for immediate single-click staff deprovisioning upon employment termination.

### 3.3 Backup & Disaster Recovery (DR) Plan
- [ ] **Automated Continuous WAL Archiving:** Configure PostgreSQL `pg_probackup` or `wal-g` with point-in-time recovery (PITR) to an isolated, encrypted, append-only S3-compatible storage tier in Egypt.
- [ ] **Tested Recovery Time Objective (RTO) / Recovery Point Objective (RPO):**
  - Target RPO: < 5 minutes
  - Target RTO: < 30 minutes
- [ ] Perform quarterly automated disaster recovery drill restoring production snapshots into an isolated staging environment.

---

## 4. Operational Standard Operating Procedures (SOPs)

### 4.1 In-Clinic Identity Verification SOP for Receptionists
1. Patient presents at reception desk stating they have an existing clinic file and want to link their online portal account.
2. Receptionist opens **Reception Workspace -> Portal Link Verification Requests**.
3. Receptionist requests original Egyptian National ID card (or valid passport for expatriates).
4. Receptionist physically compares full legal name, national ID number, and photo on document with the electronic record.
5. Only upon satisfactory visual match does the receptionist click **Approve** and record the verification audit note.
6. System logs actor ID, timestamp, and verification method in `AuditEvent`.

### 4.2 Duplicate Patient Resolution SOP
1. Receptionists must never unilaterally merge files where medical history conflict could exist.
2. Suspected duplicate matches flagged as `EXACT_NATIONAL_ID` require supervisory review by the Branch Manager.
3. If confirmed distinct (e.g. twins or family members with identical names/phones), record detailed notes and select `Mark as Distinct People`.

---

## 5. Phase-by-Phase Production Go-Live Gate

```
[ Phase 01: Foundation & Identity (Current) ]  -- COMPLETE & VERIFIED
                     |
[ Pre-Production Gate: Legal & MFA Hardening ]  -- BLOCKER FOR LIVE DATA
                     |
[ Phase 02: Appointment Scheduling & Queues ]   -- NEXT DEVELOPMENT SPRINT
                     |
[ Phase 03: Odontogram & Clinical Charting ]    -- CLINICAL DEPLOYMENT SPRINT
                     |
[ Phase 04: Billing, Invoicing & Syndicate ]    -- FINANCIAL SPRINT
                     |
[ Live Patient Beta in Branch A (Heliopolis) ]  -- CONTROLLED PILOT
```
