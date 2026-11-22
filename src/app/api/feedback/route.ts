import {branchScope,hasRole} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@/lib/prisma-shim';
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
        select: { id:true,category:true,status:true,subject:true,description:true,patientVisibleResponse:true,createdAt:true,updatedAt:true,branch:{select:{id:true,code:true,name:true}} },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ cases });
    }

    const allowed=branchScope(user,['CRM','RECEPTIONIST','OWNER_ADMIN'],branchId);const cases=await db.feedbackCase.findMany({where:{branchId:allowed,status,category},include:{branch:true},orderBy:{createdAt:'desc'}});
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

    const staff=hasRole(user,['CRM','RECEPTIONIST','OWNER_ADMIN'],branchId);
    if(body.patientId&&!staff){const link=user?await db.portalPatientLink.findFirst({where:{userId:user.id,patientId:body.patientId,status:'APPROVED'}}):null;if(!link)return NextResponse.json({error:'Forbidden patient'},{status:403});}
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

    const channel=['PHONE_CALL','WEBSITE','WHATSAPP','WALK_IN'].includes(body.sourceChannel)?body.sourceChannel:(!user?'WEBSITE':null);const saved=channel?await db.feedbackCase.update({where:{id:feedback.id},data:{sourceChannel:channel}}):feedback;return NextResponse.json({feedback:saved},{status:201});
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit feedback' }, { status: 400 });
  }
}
