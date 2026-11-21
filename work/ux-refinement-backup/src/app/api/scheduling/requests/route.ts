import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAppointmentRequest } from '@/services/scheduling.service';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId');
  const patientId = searchParams.get('patientId');

  const isPatientOnly = user.roleGrants.some((g) => g.role === Role.PATIENT) &&
    !user.roleGrants.some((g) => ([Role.RECEPTIONIST, Role.DENTIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN] as Role[]).includes(g.role));

  const whereClause: any = {};
  if (isPatientOnly) {
    const link = await db.portalPatientLink.findFirst({
      where: { userId: user.id, status: 'APPROVED' },
    });
    if (!link) {
      return NextResponse.json({ requests: [] });
    }
    whereClause.patientId = link.patientId;
  } else {
    if (patientId) whereClause.patientId = patientId;
    if (branchId) whereClause.branchId = branchId;
  }

  const requests = await db.appointmentRequest.findMany({
    where: whereClause,
    include: {
      patient: { select: { id: true, patientNumber: true, fullName: true, primaryPhone: true } },
      branch: { select: { id: true, code: true, name: true } },
      appointment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  try {
    const body = await req.json();
    const { 
      patientId, 
      branchId, 
      branchCode, 
      preferredDate, 
      preferredTimeWindow, 
      serviceName, 
      reason, 
      dentistPreferenceId,
      dentistEmail,
      selectedSlotTime,
      fullName,
      phone,
      email
    } = body;

    let targetPatientId = patientId;
    let targetBranchId = branchId;
    let resolvedDentistId = dentistPreferenceId;

    if (!resolvedDentistId && dentistEmail && dentistEmail !== 'ANY') {
      const docUser = await db.user.findUnique({ where: { email: dentistEmail } });
      if (docUser) resolvedDentistId = docUser.id;
    }

    // Resolve branch if branchCode is passed
    if (!targetBranchId && branchCode) {
      const b = await db.branch.findUnique({ where: { code: branchCode } });
      if (b) targetBranchId = b.id;
    }
    if (!targetBranchId) {
      const firstBranch = await db.branch.findFirst();
      targetBranchId = firstBranch?.id;
    }

    if (!targetBranchId) {
      return NextResponse.json({ error: 'No clinic branch available.' }, { status: 400 });
    }

    if (user) {
      const isStaff = user.roleGrants.some((g) => ([Role.RECEPTIONIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN] as Role[]).includes(g.role));
      if (!isStaff) {
        // If patient, resolve or verify patient link
        if (!targetPatientId) {
          const link = await db.portalPatientLink.findFirst({
            where: { userId: user.id, status: 'APPROVED' },
          });
          if (link) targetPatientId = link.patientId;
        } else {
          const link = await db.portalPatientLink.findFirst({
            where: { userId: user.id, patientId: targetPatientId, status: 'APPROVED' },
          });
          if (!link) {
            return NextResponse.json({ error: 'Forbidden: You can only request visits for your own authorized record.' }, { status: 403 });
          }
        }
      }
    }

    // If still no targetPatientId, handle guest submission
    if (!targetPatientId) {
      if (!fullName || !phone) {
        return NextResponse.json({ error: 'Full name and contact phone number are required for appointment requests.' }, { status: 400 });
      }

      // Check if patient exists by phone
      let patient = await db.patient.findFirst({
        where: { primaryPhone: phone.trim() },
      });

      if (!patient) {
        const count = await db.patient.count();
        const patientNumber = `PT-${(count + 1).toString().padStart(5, '0')}`;
        patient = await db.patient.create({
          data: {
            patientNumber,
            fullName: fullName.trim(),
            primaryPhone: phone.trim(),
            dateOfBirth: new Date('1990-01-01'),
            gender: 'UNKNOWN',
            primaryBranchId: targetBranchId,
          },
        });
      }
      targetPatientId = patient.id;
    }

    const request = await createAppointmentRequest(
      {
        patientId: targetPatientId,
        branchId: targetBranchId,
        dentistPreferenceId: resolvedDentistId || undefined,
        serviceName: serviceName || 'General Consultation',
        preferredDate: preferredDate || new Date().toISOString().split('T')[0],
        preferredTimeWindow: preferredTimeWindow || 'ANYTIME',
        reason:
          reason ||
          (selectedSlotTime
            ? `Requested Slot: ${selectedSlotTime} — ${fullName || 'Patient'}`
            : fullName
            ? `Website appointment request from ${fullName}`
            : 'Dental consultation request'),
      },
      user ? { id: user.id, role: user.roleGrants[0]?.role } : undefined
    );

    return NextResponse.json({ 
      success: true, 
      request,
      trackingCode: request.id 
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create request' }, { status: 400 });
  }
}
