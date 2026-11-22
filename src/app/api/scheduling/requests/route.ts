import {getOperationalUser} from '@/lib/operational-auth';
import {branchScope,hasRole} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAppointmentRequest } from '@/services/scheduling.service';
import { Role } from '@/lib/prisma-shim';

export async function GET(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const code=searchParams.get('branchCode');const branchId=code?(await db.branch.findUnique({where:{code},select:{id:true}}))?.id||'missing':searchParams.get('branchId');
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
    if(!hasRole(user,['RECEPTIONIST','OWNER_ADMIN']))return NextResponse.json({error:'Forbidden'},{status:403});
    try {whereClause.branchId=branchScope(user,['RECEPTIONIST','OWNER_ADMIN'],branchId);}catch{return NextResponse.json({error:'Forbidden branch'},{status:403});}
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
  const user=await getOperationalUser();
  try {
    const { z }=await import('zod');
    const { submitBooking,confirmBooking }=await import('@/services/booking.service');
    const { CLINIC_SERVICES }=await import('@/config/clinic-catalog');
    const body=z.object({submissionKey:z.string().uuid(),patientId:z.string().optional(),branchId:z.string().optional(),branchCode:z.string().optional(),preferredDate:z.string(),selectedSlotTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),dentistEmail:z.string().optional(),serviceSlug:z.string().optional(),serviceName:z.string().max(200).optional(),reason:z.string().max(1000).optional(),fullName:z.string().min(3).max(120).optional(),phone:z.string().min(8).max(25).optional(),dateOfBirth:z.string().optional(),source:z.enum(['WEBSITE','RECEPTION_PHONE','WHATSAPP','WALK_IN','OTHER']).default('WEBSITE'),confirm:z.boolean().optional()}).parse(await req.json());
    const branch=body.branchId?await db.branch.findUnique({where:{id:body.branchId}}):await db.branch.findUnique({where:{code:body.branchCode||''}});
    if(!branch?.isActive)throw new Error('Choose an active branch.');
    const dentist=body.dentistEmail&&body.dentistEmail!=='ANY'?await db.user.findUnique({where:{email:body.dentistEmail}}):null;
    if(body.dentistEmail&&body.dentistEmail!=='ANY'&&!dentist)throw new Error('Choose an available dentist.');
    const service=CLINIC_SERVICES.find(s=>s.slug===body.serviceSlug);
    const request=await submitBooking({submissionKey:body.submissionKey,branchId:branch.id,patientId:body.patientId,day:body.preferredDate,time:body.selectedSlotTime,dentistId:dentist?.id,serviceName:service?.nameEn||body.serviceName||'Consultation',durationMinutes:service?.durationMinutes||45,fullName:body.fullName,phone:body.phone,dateOfBirth:body.dateOfBirth,reason:body.reason,source:body.source},user);
    const appointment=body.confirm&&user?await confirmBooking(request.id,user):null;
    return NextResponse.json({success:true,request,appointment,trackingCode:request.id},{status:201});
  } catch(e:any){const message=e.name==='ZodError'?'Please select a branch, date and an available appointment time.':e.message||'Could not save the booking.';return NextResponse.json({error:message},{status:e.statusCode||400});}
}
