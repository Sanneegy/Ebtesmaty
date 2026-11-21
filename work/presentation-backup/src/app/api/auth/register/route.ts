import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { hashPassword, createSession, setSessionCookie } from '../../../../lib/auth';
import { generateNextPatientNumber } from '../../../../services/patient.service';
import { logAuditEvent } from '../../../../lib/audit';
import { Role, UserStatus, PatientSource, MigrationStatus, LinkStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, dateOfBirth, gender, primaryPhone, email, password } = body;

    if (!fullName || !dateOfBirth || !gender || !primaryPhone || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // Check if email or phone already used for User account
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email: email.trim().toLowerCase() }, { phone: primaryPhone.trim() }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email or phone number already exists. Please sign in instead.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const patientNumber = await generateNextPatientNumber();
    const dob = new Date(dateOfBirth);

    // Create User, Patient, and approved Portal link in a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: email.trim().toLowerCase(),
          phone: primaryPhone.trim(),
          fullName: fullName.trim(),
          passwordHash,
          status: UserStatus.ACTIVE,
          roleGrants: {
            create: { role: Role.PATIENT, branchId: null },
          },
        },
      });

      // 2. Create isolated Patient record for this self-registration (NEVER hijack existing records!)
      const patient = await tx.patient.create({
        data: {
          patientNumber,
          fullName: fullName.trim(),
          dateOfBirth: dob,
          gender,
          primaryPhone: primaryPhone.trim(),
          source: PatientSource.ONLINE_SELF_REG,
          migrationStatus: MigrationStatus.FULLY_DIGITIZED,
          contacts: {
            create: [
              { contactType: 'PHONE', value: primaryPhone.trim(), isPrimary: true, isVerified: true },
              { contactType: 'EMAIL', value: email.trim().toLowerCase(), isPrimary: false, isVerified: true },
            ],
          },
        },
      });

      // 3. Link user to their newly created patient profile
      await tx.portalPatientLink.create({
        data: {
          userId: user.id,
          patientId: patient.id,
          status: LinkStatus.APPROVED,
          verificationNotes: 'Self-registered patient identity automatically linked to own profile.',
        },
      });

      return { user, patient };
    });

    // Create session and cookie
    const { token, expiresAt } = await createSession(result.user.id);
    await setSessionCookie(token, expiresAt);

    await logAuditEvent({
      actorUserId: result.user.id,
      actorRole: 'PATIENT',
      action: 'PATIENT_SELF_REGISTERED',
      entityType: 'User',
      entityId: result.user.id,
      metadata: { patientNumber: result.patient.patientNumber },
    });

    return NextResponse.json({ success: true, redirectUrl: '/portal' });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
