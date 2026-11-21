import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { getFeedbackCases, submitFeedbackCase } from '@/services/communications.service';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || undefined;
  const status = (searchParams.get('status') as any) || undefined;
  const category = (searchParams.get('category') as any) || undefined;

  try {
    const isPatientOnly = user.roleGrants.every((g) => g.role === Role.PATIENT);
    if (isPatientOnly) {
      const link = await db.portalPatientLink.findFirst({
        where: { userId: user.id, status: 'APPROVED' },
      });
      if (!link) return NextResponse.json({ cases: [] });

      const cases = await db.feedbackCase.findMany({
        where: { patientId: link.patientId },
        include: { branch: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ cases });
    }

    const cases = await getFeedbackCases(branchId, status, category);
    return NextResponse.json({ cases });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch feedback cases' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  try {
    const body = await req.json();

    let branchId = body.branchId;
    if (!branchId && body.branchCode) {
      const branch = await db.branch.findUnique({ where: { code: body.branchCode } });
      branchId = branch?.id;
    }

    let patientId = body.patientId;
    if (!patientId && user) {
      const link = await db.portalPatientLink.findFirst({
        where: { userId: user.id, status: 'APPROVED' },
      });
      patientId = link?.patientId || undefined;
    }

    const contactHeader =
      body.contactName || body.contactPhone
        ? `[Contact: ${body.contactName || 'Visitor'} | Phone: ${body.contactPhone || 'N/A'}${body.contactEmail ? ` | Email: ${body.contactEmail}` : ''}] `
        : '';

    const feedback = await submitFeedbackCase({
      patientId,
      branchId,
      category: body.category || 'INQUIRY',
      subject: body.subject || 'Public Website Inquiry',
      description: `${contactHeader}${body.description || ''}`.trim(),
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit feedback' }, { status: 400 });
  }
}
