import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { createPatient } from '../../../../services/patient.service';
import { PatientSource, MigrationStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullName,
      dateOfBirth,
      gender,
      primaryPhone,
      secondaryPhone,
      nationalIdOrPassport,
      address,
      emergencyContactName,
      emergencyContactPhone,
      primaryBranchId,
      migrationStatus,
      legacyBalanceNotes,
    } = body;

    if (!fullName || !dateOfBirth || !gender || !primaryPhone) {
      return NextResponse.json(
        { error: 'Full name, date of birth, gender, and primary phone are required' },
        { status: 400 }
      );
    }

    const result = await createPatient(
      {
        fullName,
        dateOfBirth,
        gender,
        primaryPhone,
        secondaryPhone,
        nationalIdOrPassport,
        address,
        emergencyContactName,
        emergencyContactPhone,
        source: PatientSource.CLINIC_ENTRY,
        migrationStatus: migrationStatus || MigrationStatus.FULLY_DIGITIZED,
        legacyBalanceNotes,
        primaryBranchId: primaryBranchId || user.roleGrants[0]?.branchId,
      },
      user
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Create patient error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create patient' }, { status: err.statusCode || 500 });
  }
}
