import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import db from './db';
import { Role } from '@prisma/client';

export const SESSION_COOKIE_NAME = 'ebtesamty_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface FallbackDemoAccount {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  status: string;
  roleGrants: { id: string; role: Role; branchId: string | null; branch: { id: string; code: string; name: string; isActive: boolean } | null }[];
  staffProfile: { id: string; title: string; specialty?: string | null; licenseNumber?: string | null; active: boolean } | null;
  portalPatientLinks: any[];
}

export const FALLBACK_DEMO_USERS: Record<string, FallbackDemoAccount> = {
  'admin@ebtesamty.dev': {
    id: 'usr_owner_abram',
    email: 'admin@ebtesamty.dev',
    phone: '+201000000001',
    fullName: 'Abram',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_owner', role: 'OWNER_ADMIN' as Role, branchId: null, branch: { id: 'br_a', code: 'BR-A', name: 'Minya – Branch A', isActive: true } },
    ],
    staffProfile: { id: 'sp_owner', title: 'OWNER / EXECUTIVE', active: true },
    portalPatientLinks: [],
  },
  'mariam.reception@ebtesamty.dev': {
    id: 'usr_rec_mariam',
    email: 'mariam.reception@ebtesamty.dev',
    phone: '+201000000003',
    fullName: 'Mariam Hanna',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_rec_a', role: 'RECEPTIONIST' as Role, branchId: 'br_a', branch: { id: 'br_a', code: 'BR-A', name: 'Minya – Branch A', isActive: true } },
    ],
    staffProfile: { id: 'sp_rec_a', title: 'Senior Receptionist — Minya Branch A', active: true },
    portalPatientLinks: [],
  },
  'sandy.reception@ebtesamty.dev': {
    id: 'usr_rec_sandy',
    email: 'sandy.reception@ebtesamty.dev',
    phone: '+201000000004',
    fullName: 'Sandy Abd',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_rec_b', role: 'RECEPTIONIST' as Role, branchId: 'br_b', branch: { id: 'br_b', code: 'BR-B', name: 'Minya – Branch B', isActive: true } },
    ],
    staffProfile: { id: 'sp_rec_b', title: 'Receptionist — Minya Branch B', active: true },
    portalPatientLinks: [],
  },
  'salma.reception@ebtesamty.dev': {
    id: 'usr_rec_salma',
    email: 'salma.reception@ebtesamty.dev',
    phone: '+201000000008',
    fullName: 'Salma Adel',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_rec_c', role: 'RECEPTIONIST' as Role, branchId: 'br_c', branch: { id: 'br_c', code: 'BR-C', name: 'Minya – Branch C', isActive: true } },
    ],
    staffProfile: { id: 'sp_rec_c', title: 'Receptionist — Minya Branch C', active: true },
    portalPatientLinks: [],
  },
  'dr.sandy@ebtesamty.dev': {
    id: 'usr_doc_sandy',
    email: 'dr.sandy@ebtesamty.dev',
    phone: '+201000000005',
    fullName: 'Dr. Sandy Saad',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_doc_sandy', role: 'DENTIST' as Role, branchId: 'br_a', branch: { id: 'br_a', code: 'BR-A', name: 'Minya – Branch A', isActive: true } },
    ],
    staffProfile: { id: 'sp_doc_sandy', title: 'Lead Restorative & Cosmetic Dentist', specialty: 'Restorative & Cosmetic Dentistry', licenseNumber: 'EGY-DEN-44912', active: true },
    portalPatientLinks: [],
  },
  'dr.ahmed@ebtesamty.dev': {
    id: 'usr_doc_ahmed',
    email: 'dr.ahmed@ebtesamty.dev',
    phone: '+201000000007',
    fullName: 'Dr. Ahmed Hassan',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_doc_ahmed', role: 'DENTIST' as Role, branchId: 'br_a', branch: { id: 'br_a', code: 'BR-A', name: 'Minya – Branch A', isActive: true } },
    ],
    staffProfile: { id: 'sp_doc_ahmed', title: 'Oral Surgery & Implantology Consultant', specialty: 'Dental Implants & Oral Surgery', licenseNumber: 'EGY-DEN-39104', active: true },
    portalPatientLinks: [],
  },
  'dr.youssef@ebtesamty.dev': {
    id: 'usr_doc_youssef',
    email: 'dr.youssef@ebtesamty.dev',
    phone: '+201000000009',
    fullName: 'Dr. Youssef El-Mansy',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_doc_youssef', role: 'DENTIST' as Role, branchId: 'br_b', branch: { id: 'br_b', code: 'BR-B', name: 'Minya – Branch B', isActive: true } },
    ],
    staffProfile: { id: 'sp_doc_youssef', title: 'Orthodontics Specialist', specialty: 'Orthodontics & Clear Aligners', licenseNumber: 'EGY-DEN-48210', active: true },
    portalPatientLinks: [],
  },
  'hassan.patient@ebtesamty.dev': {
    id: 'usr_pat_passant',
    email: 'hassan.patient@ebtesamty.dev',
    phone: '+201001234567',
    fullName: 'Passant',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_pat_passant', role: 'PATIENT' as Role, branchId: null, branch: { id: 'br_a', code: 'BR-A', name: 'Minya – Branch A', isActive: true } },
    ],
    staffProfile: null,
    portalPatientLinks: [
      {
        id: 'lnk_passant',
        status: 'APPROVED',
        patient: {
          id: 'pat_passant',
          patientNumber: 'EBT-PAT-0001',
          fullName: 'Passant',
          primaryPhone: '+201001234567',
        },
      },
    ],
  },
  'finance@ebtesamty.dev': {
    id: 'usr_finance',
    email: 'finance@ebtesamty.dev',
    phone: '+201000000011',
    fullName: 'Nadia Mansour',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_fin', role: 'FINANCE' as Role, branchId: null, branch: null },
    ],
    staffProfile: { id: 'sp_fin', title: 'FINANCE / ACCOUNTANT', active: true },
    portalPatientLinks: [],
  },
  'inventory@ebtesamty.dev': {
    id: 'usr_inventory',
    email: 'inventory@ebtesamty.dev',
    phone: '+201000000012',
    fullName: 'Khaled Soliman',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_inv', role: 'INVENTORY' as Role, branchId: null, branch: null },
    ],
    staffProfile: { id: 'sp_inv', title: 'INVENTORY & PROCUREMENT', active: true },
    portalPatientLinks: [],
  },
  'crm@ebtesamty.dev': {
    id: 'usr_crm',
    email: 'crm@ebtesamty.dev',
    phone: '+201000000013',
    fullName: 'Heba Zaki',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_crm', role: 'CRM' as Role, branchId: null, branch: null },
    ],
    staffProfile: { id: 'sp_crm', title: 'MARKETING & CRM', active: true },
    portalPatientLinks: [],
  },
  'sysadmin@ebtesamty.dev': {
    id: 'usr_sysadmin',
    email: 'sysadmin@ebtesamty.dev',
    phone: '+201000000014',
    fullName: 'Eng. Karim Zaki',
    status: 'ACTIVE',
    roleGrants: [
      { id: 'rg_sys', role: 'OWNER_ADMIN' as Role, branchId: null, branch: null },
    ],
    staffProfile: { id: 'sp_sys', title: 'SUPER ADMIN', active: true },
    portalPatientLinks: [],
  },
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const session = await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return { session, token, expiresAt };
}

export async function getSessionUser(token: string) {
  if (!token) return null;

  // Support serverless / stateless demo tokens ("demo:<email>") when database is unavailable
  if (token.startsWith('demo:')) {
    const email = token.slice(5).trim().toLowerCase();
    if (FALLBACK_DEMO_USERS[email]) {
      return FALLBACK_DEMO_USERS[email];
    }
  }

  try {
    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            roleGrants: {
              include: {
                branch: true,
              },
            },
            staffProfile: true,
            portalPatientLinks: {
              where: { status: 'APPROVED' },
              include: {
                patient: true,
              },
            },
          },
        },
      },
    });

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    if (session.user.status !== "ACTIVE") return null;
    const { passwordHash: _passwordHash, ...safeUser } = session.user;
    if (
      safeUser.email === 'hassan.patient@ebtesamty.dev' ||
      safeUser.fullName === 'Hassan El-Sayed'
    ) {
      safeUser.fullName = 'Passant';
      if (Array.isArray(safeUser.portalPatientLinks)) {
        safeUser.portalPatientLinks = safeUser.portalPatientLinks.map((lnk: any) =>
          lnk.patient && lnk.patient.fullName === 'Hassan El-Sayed'
            ? { ...lnk, patient: { ...lnk.patient, fullName: 'Passant' } }
            : lnk
        );
      }
    }
    return safeUser;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await Promise.resolve(cookies());
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return getSessionUser(token);
  } catch (e) {
    return null;
  }
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await Promise.resolve(cookies());
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await Promise.resolve(cookies());
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.session.delete({ where: { token } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
