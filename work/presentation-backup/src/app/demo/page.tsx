import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Building2,
  Stethoscope,
  ClipboardList,
  Receipt,
  Package,
  HeartHandshake,
  ShieldCheck,
  User,
} from 'lucide-react';

interface DemoAccount {
  id: string;
  email: string;
  name: string;
  roleLabel: string;
  dashboardName: string;
  branch: string;
  description: string;
  redirectTo: string;
  badgeColor: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  // Executive & Functional Dashboards (Each with a distinct account & role identity)
  {
    id: 'exec-owner',
    email: 'admin@ebtesamty.dev',
    name: 'Dr. Tarek El-Gendy',
    roleLabel: 'OWNER / EXECUTIVE',
    dashboardName: 'Executive Management (/management)',
    branch: 'All Branches + BR-A / BR-B / BR-C Drill-Down',
    description:
      'Consolidated executive KPIs (default scope: All Branches), branch comparison, revenue vs. collections, net margin, dentist utilization, and executive alerts.',
    redirectTo: '/management',
    badgeColor: 'bg-[#163447] text-white',
  },
  {
    id: 'finance-accountant',
    email: 'finance@ebtesamty.dev',
    name: 'Nadia Mansour',
    roleLabel: 'FINANCE / ACCOUNTANT',
    dashboardName: 'Billing & Finance (/billing)',
    branch: 'All Branches (BR-A, BR-B, BR-C)',
    description:
      'Full Finance & Accounting workspace: invoices, multi-method EGP collections (Cash, Card, InstaPay, Fawry), receivables aging, cash reconciliation, and operating expenses.',
    redirectTo: '/billing',
    badgeColor: 'bg-[#176C5B] text-white',
  },
  {
    id: 'inventory-procurement',
    email: 'inventory@ebtesamty.dev',
    name: 'Khaled Soliman',
    roleLabel: 'INVENTORY & PROCUREMENT',
    dashboardName: 'Stock & Purchasing (/inventory)',
    branch: 'All Branches (BR-A, BR-B, BR-C)',
    description:
      'Dental consumables catalog, branch stock vs. threshold charts, near-expiry lot monitoring, traceable inter-branch transfers, suppliers, and purchase orders (/purchasing).',
    redirectTo: '/inventory',
    badgeColor: 'bg-[#176C5B] text-white',
  },
  {
    id: 'crm-retention',
    email: 'crm@ebtesamty.dev',
    name: 'Heba Zaki',
    roleLabel: 'MARKETING & CRM',
    dashboardName: 'CRM & Recalls (/crm)',
    branch: 'All Branches (BR-A, BR-B, BR-C)',
    description:
      'Website/phone/WhatsApp inquiry pipeline, 4-stage conversion funnel analytics, source attribution, patient recall / follow-up list, and verified feedback moderation.',
    redirectTo: '/crm',
    badgeColor: 'bg-[#176C5B] text-white',
  },
  {
    id: 'super-admin',
    email: 'sysadmin@ebtesamty.dev',
    name: 'Eng. Karim Zaki',
    roleLabel: 'SUPER ADMIN',
    dashboardName: 'System Configuration (/admin)',
    branch: 'Global System Scope',
    description:
      'Branch & operatory configuration, user roles & permissions, service catalog & EGP pricing, integration health, and immutable zero-PHI audit logs.',
    redirectTo: '/admin',
    badgeColor: 'bg-[#163447] text-white',
  },

  // 3 Receptionists (1 per branch)
  {
    id: 'rec-bra',
    email: 'mariam.reception@ebtesamty.dev',
    name: 'Mariam Hanna',
    roleLabel: 'RECEPTIONIST (BR-A)',
    dashboardName: 'Front Desk (/reception)',
    branch: 'Branch A — Heliopolis',
    description:
      'Front desk queue, online booking confirmation, walk-in registration, arrival check-in, portal link verification, and checkout.',
    redirectTo: '/reception',
    badgeColor: 'bg-[#EAF3FF] text-[#176C5B]',
  },
  {
    id: 'rec-brb',
    email: 'sandy.reception@ebtesamty.dev',
    name: 'Sandy Abd',
    roleLabel: 'RECEPTIONIST (BR-B)',
    dashboardName: 'Front Desk (/reception)',
    branch: 'Branch B — New Cairo',
    description:
      'Front desk scheduling, daily chair agenda (/reception/agenda), arrival check-in, and patient coordination for New Cairo.',
    redirectTo: '/reception',
    badgeColor: 'bg-[#EAF3FF] text-[#176C5B]',
  },
  {
    id: 'rec-brc',
    email: 'salma.reception@ebtesamty.dev',
    name: 'Salma El-Masry',
    roleLabel: 'RECEPTIONIST (BR-C)',
    dashboardName: 'Front Desk (/reception)',
    branch: 'Branch C — Maadi',
    description:
      'Front desk operations, patient check-in, and appointment coordination for Maadi.',
    redirectTo: '/reception',
    badgeColor: 'bg-[#EAF3FF] text-[#176C5B]',
  },

  // 5 Dentists (2 at BR-A, 2 at BR-B, 1 at BR-C)
  {
    id: 'doc-sandy',
    email: 'dr.sandy@ebtesamty.dev',
    name: 'Dr. Sandy Saad',
    roleLabel: 'DENTIST (BR-A #1)',
    dashboardName: 'Clinical Workspace (/dentist)',
    branch: 'Branch A — Heliopolis',
    description:
      'Prosthodontics & Cosmetic Dentistry. Assigned treating dentist for Hassan El-Sayed & Omar Farouk; full FDI odontogram and SOAP notes.',
    redirectTo: '/dentist',
    badgeColor: 'bg-[#EAF3FF] text-[#163447]',
  },
  {
    id: 'doc-feby',
    email: 'dr.feby@ebtesamty.dev',
    name: 'Dr. Feby Samer',
    roleLabel: 'DENTIST (BR-A #2)',
    dashboardName: 'Clinical Workspace (/dentist)',
    branch: 'Branch A — Heliopolis',
    description:
      'Endodontics & Microscopic Root Canal Therapy at Branch A (Heliopolis).',
    redirectTo: '/dentist',
    badgeColor: 'bg-[#EAF3FF] text-[#163447]',
  },
  {
    id: 'doc-ahmed',
    email: 'dr.ahmed@ebtesamty.dev',
    name: 'Dr. Ahmed Hassan',
    roleLabel: 'DENTIST (BR-B #1)',
    dashboardName: 'Clinical Workspace (/dentist)',
    branch: 'Branch B — New Cairo',
    description:
      'Oral & Maxillofacial Surgery & Implantology at Branch B (New Cairo). Demonstrates cross-branch RBAC isolation for unassigned charts.',
    redirectTo: '/dentist',
    badgeColor: 'bg-[#EAF3FF] text-[#163447]',
  },
  {
    id: 'doc-youssef',
    email: 'dr.youssef@ebtesamty.dev',
    name: 'Dr. Youssef El-Mansy',
    roleLabel: 'DENTIST (BR-B #2)',
    dashboardName: 'Clinical Workspace (/dentist)',
    branch: 'Branch B — New Cairo',
    description:
      'Orthodontics & Clear Aligners specialist at Branch B (New Cairo).',
    redirectTo: '/dentist',
    badgeColor: 'bg-[#EAF3FF] text-[#163447]',
  },
  {
    id: 'doc-nadia',
    email: 'dr.nadia@ebtesamty.dev',
    name: 'Dr. Nadia El-Hariry',
    roleLabel: 'DENTIST (BR-C #1)',
    dashboardName: 'Clinical Workspace (/dentist)',
    branch: 'Branch C — Maadi',
    description:
      'Pediatric & Family Restorative Dentistry lead at Branch C (Maadi).',
    redirectTo: '/dentist',
    badgeColor: 'bg-[#EAF3FF] text-[#163447]',
  },

  // 3 Portal Patients
  {
    id: 'pat-hassan',
    email: 'hassan.patient@ebtesamty.dev',
    name: 'Hassan El-Sayed',
    roleLabel: 'PATIENT PORTAL',
    dashboardName: 'Patient Portal (/portal)',
    branch: 'Branch A — Heliopolis',
    description:
      'Verified portal patient (EBT-PAT-2026-0001) with active treatment plan, invoice balance, medical intake versions, and feedback.',
    redirectTo: '/portal',
    badgeColor: 'bg-amber-100 text-amber-900',
  },
  {
    id: 'pat-nour',
    email: 'nour.patient@ebtesamty.dev',
    name: 'Nour Mansour',
    roleLabel: 'PATIENT PORTAL',
    dashboardName: 'Patient Portal (/portal)',
    branch: 'Branch B — New Cairo',
    description:
      'Self-registered portal patient with a PENDING link verification request awaiting reception approval.',
    redirectTo: '/portal',
    badgeColor: 'bg-amber-100 text-amber-900',
  },
  {
    id: 'pat-layla',
    email: 'layla.patient@ebtesamty.dev',
    name: 'Layla Mahmoud',
    roleLabel: 'PATIENT PORTAL',
    dashboardName: 'Patient Portal (/portal)',
    branch: 'Branch C — Maadi',
    description:
      'Verified portal patient at Maadi with an unsubmitted DRAFT medical intake ready for completion.',
    redirectTo: '/portal',
    badgeColor: 'bg-amber-100 text-amber-900',
  },
];

export default function DemoSwitcherPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526574] hover:text-[#163447] mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Website</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#EAF3FF] text-[#176C5B] rounded-xl border border-[#176C5B]/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#163447]">
                Ebtesamty Role &amp; Workspace Switcher (Demo)
              </h1>
              <p className="text-sm text-[#526574]">
                One-click instant session switcher across all 7 internal dashboards and the Patient Portal. Seed password:{' '}
                <code className="bg-white border border-[#D8E0DC] px-2 py-0.5 rounded text-[#163447] font-mono text-xs">
                  Password123!
                </code>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/book"
            className="px-4 py-2.5 rounded-xl bg-[#176C5B] text-white text-xs font-bold hover:bg-[#125648] transition-colors"
          >
            Test Public Booking (/book)
          </Link>
          <Link
            href="/login"
            className="px-4 py-2.5 rounded-xl bg-white border border-[#D8E0DC] text-[#163447] text-xs font-bold hover:bg-[#EAF3FF]/50 transition-colors"
          >
            Standard Login Page
          </Link>
        </div>
      </div>

      <div className="p-4 bg-[#EAF3FF] border border-[#176C5B]/25 rounded-2xl text-xs text-[#163447] flex items-start gap-3">
        <CheckCircle2 className="w-4 h-4 text-[#176C5B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div>
            <span className="font-bold">Authoritative Multi-Branch Staffing Model (Egypt):</span> 3 Branches (
            <strong>BR-A Heliopolis</strong>: 2 dentists + 1 receptionist;{' '}
            <strong>BR-B New Cairo</strong>: 2 dentists + 1 receptionist;{' '}
            <strong>BR-C Maadi</strong>: 1 dentist + 1 receptionist).
          </div>
          <div className="text-[#526574]">
            All profiles below are clearly labeled fictional demonstration accounts persisted in PostgreSQL.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DEMO_ACCOUNTS.map((acc) => (
          <div
            key={acc.id}
            className="p-5 bg-white rounded-2xl border border-[#D8E0DC] shadow-sm hover:border-[#176C5B] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${acc.badgeColor}`}>
                  {acc.roleLabel}
                </span>
                <span className="text-xs text-[#526574] font-semibold truncate">{acc.branch}</span>
              </div>
              <h2 className="text-base font-bold text-[#163447] mb-0.5">{acc.name}</h2>
              <p className="text-xs font-semibold text-[#176C5B] mb-1">{acc.dashboardName}</p>
              <p className="text-xs text-[#526574] font-mono mb-3">{acc.email}</p>
              <p className="text-xs text-[#526574] leading-relaxed mb-5">{acc.description}</p>
            </div>

            <form action="/api/auth/demo-switch" method="POST">
              <input type="hidden" name="email" value={acc.email} />
              <input type="hidden" name="redirectTo" value={acc.redirectTo} />
              <button
                type="submit"
                className="w-full py-2.5 px-3 bg-[#163447] hover:bg-[#176C5B] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Open {acc.dashboardName.split(' (')[0]}</span>
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
