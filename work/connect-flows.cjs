const fs=require('fs');function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')))}
fs.writeFileSync('src/app/api/scheduling/availability/route.ts',`import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { availability } from '@/services/booking.service';
import { CLINIC_SERVICES } from '@/config/clinic-catalog';
export async function GET(req:Request){try{const p=new URL(req.url).searchParams;const branch=await db.branch.findUnique({where:{code:p.get('branchCode')||'BR-A'}});if(!branch||!branch.isActive)throw new Error('Choose an active branch.');const email=p.get('dentistEmail');const dentist=email&&email!=='ANY'?await db.user.findUnique({where:{email}}):null;if(email&&email!=='ANY'&&!dentist)throw new Error('Choose an available dentist.');const service=CLINIC_SERVICES.find(s=>s.slug===p.get('service'));const duration=service?.durationMinutes||45;const result=await availability(branch.id,p.get('date')||'',dentist?.id,duration);return NextResponse.json({branchCode:branch.code,date:p.get('date'),slots:result.slots,duties:result.duties.map(d=>({dentistId:d.dentistUserId,dentistName:d.dentistUser.fullName,dentistEmail:d.dentistUser.email}))});}catch(e:any){return NextResponse.json({error:e.message},{status:400});}}
`);
edit('src/app/api/scheduling/requests/route.ts',s=>s.slice(0,s.indexOf('export async function POST'))+`export async function POST(req: NextRequest) {
  const user=await getCurrentUser();
  try {
    const { z }=await import('zod');
    const { submitBooking,confirmBooking }=await import('@/services/booking.service');
    const { CLINIC_SERVICES }=await import('@/config/clinic-catalog');
    const body=z.object({patientId:z.string().optional(),branchId:z.string().optional(),branchCode:z.string().optional(),preferredDate:z.string(),selectedSlotTime:z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/),dentistEmail:z.string().optional(),serviceSlug:z.string().optional(),serviceName:z.string().max(200).optional(),reason:z.string().max(1000).optional(),fullName:z.string().min(3).max(120).optional(),phone:z.string().min(8).max(25).optional(),dateOfBirth:z.string().optional(),source:z.enum(['WEBSITE','RECEPTION_PHONE','WHATSAPP','WALK_IN','OTHER']).default('WEBSITE'),confirm:z.boolean().optional()}).parse(await req.json());
    const branch=body.branchId?await db.branch.findUnique({where:{id:body.branchId}}):await db.branch.findUnique({where:{code:body.branchCode||''}});
    if(!branch?.isActive)throw new Error('Choose an active branch.');
    const dentist=body.dentistEmail&&body.dentistEmail!=='ANY'?await db.user.findUnique({where:{email:body.dentistEmail}}):null;
    if(body.dentistEmail&&body.dentistEmail!=='ANY'&&!dentist)throw new Error('Choose an available dentist.');
    const service=CLINIC_SERVICES.find(s=>s.slug===body.serviceSlug);
    const request=await submitBooking({branchId:branch.id,patientId:body.patientId,day:body.preferredDate,time:body.selectedSlotTime,dentistId:dentist?.id,serviceName:service?.nameEn||body.serviceName||'Consultation',durationMinutes:service?.durationMinutes||45,fullName:body.fullName,phone:body.phone,dateOfBirth:body.dateOfBirth,reason:body.reason,source:body.source},user);
    const appointment=body.confirm&&user?await confirmBooking(request.id,user):null;
    return NextResponse.json({success:true,request,appointment,trackingCode:request.id},{status:201});
  } catch(e:any){return NextResponse.json({error:e.message||'Could not save the booking.'},{status:e.statusCode||400});}
}
`);
edit('src/services/scheduling.service.ts',s=>{
 s="import { confirmBooking } from './booking.service';\nimport { requireRole } from '@/lib/rbac';\n"+s;
 const begin=s.indexOf("  if (action === 'CONFIRM') {");const end=s.indexOf("\n  throw new Error('Unsupported action.');",begin);
 s=s.slice(0,begin)+`  if (action === 'CONFIRM') {
    const user=await db.user.findUniqueOrThrow({where:{id:actor.id},include:{roleGrants:true}});
    const appointment=await confirmBooking(requestId,user,payload.confirmData);
    return {request:await db.appointmentRequest.findUnique({where:{id:requestId}}),appointment};
  }
`+s.slice(end);
 s=s.replace("  if (!req) {", "  const authorizedActor=await db.user.findUniqueOrThrow({where:{id:actor.id},include:{roleGrants:true}});\n  if(req)requireRole(authorizedActor,['RECEPTIONIST','OWNER_ADMIN'],req.branchId);\n  if (!req) {");
 return s;
});
edit('src/app/api/scheduling/arrivals/route.ts',s=>s.slice(0,s.indexOf('export async function POST'))+`export async function POST(req:NextRequest){try{const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Sign in to continue.'},{status:401});const {z}=await import('zod');const input=z.object({patientId:z.string().min(1),branchId:z.string().min(1),appointmentId:z.string().min(1).optional(),lateReason:z.string().max(300).optional()}).parse(await req.json());const {checkIn}=await import('@/services/visit.service');return NextResponse.json(await checkIn(input,user),{status:201});}catch(e:any){return NextResponse.json({error:e.message},{status:e.statusCode||400});}}
`);
fs.writeFileSync('src/app/api/scheduling/arrivals/[id]/verify/route.ts',`import {NextResponse} from 'next/server';import db from '@/lib/db';import {getCurrentUser} from '@/lib/auth';import {checkIn} from '@/services/visit.service';
export async function POST(req:Request,{params}:{params:{id:string}}){try{const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Sign in to continue.'},{status:401});const arrival=await db.arrivalEvent.findUniqueOrThrow({where:{id:params.id}});return NextResponse.json(await checkIn({patientId:arrival.patientId,branchId:arrival.branchId,appointmentId:arrival.appointmentId||undefined},user));}catch(e:any){return NextResponse.json({error:e.message},{status:e.statusCode||400});}}
`);
fs.writeFileSync('src/app/api/scheduling/queue/[id]/transition/route.ts',`import {NextResponse} from 'next/server';import {getCurrentUser} from '@/lib/auth';import {transitionVisit} from '@/services/visit.service';
export async function POST(req:Request,{params}:{params:{id:string}}){try{const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Sign in to continue.'},{status:401});const body=await req.json();return NextResponse.json({queueEntry:await transitionVisit(params.id,body.action,user)});}catch(e:any){return NextResponse.json({error:e.message},{status:e.statusCode||400});}}
`);
edit('src/app/api/scheduling/queue/route.ts',s=>{
 s="import { orderVisits } from '@/lib/scheduling-rules';\nimport { getQueuePolicy } from '@/services/visit.service';\n"+s;
 s=s.replace(/          medicalSubmissions: \{[\s\S]*?\n          \},/,'');
 s=s.replace('id: true, startTime: true, serviceDescription: true','id: true, appointmentDate: true, startTime: true, serviceDescription: true');
 s=s.replace('  return NextResponse.json({ queue });',`  const grouped = new Map<string, typeof queue>();
  for(const entry of queue) grouped.set(entry.branchId,[...(grouped.get(entry.branchId)||[]),entry]);
  const ordered=[];
  for(const [id,entries] of grouped) ordered.push(...orderVisits(entries,await getQueuePolicy(id)));
  return NextResponse.json({ queue:ordered });`);
 return s.slice(0,s.indexOf('export async function POST'))+`export async function POST(){return NextResponse.json({error:'Create a walk-in booking in an available slot, then check in at reception.'},{status:409});}\n`;
});
edit('src/app/book/page.tsx',s=>s.replace("useState<string>('1992-05-15')","useState<string>('')").replace('useState<boolean>(true)','useState<boolean>(false)').replace("    time: '10:30',\n    label: '10:30 AM',","    time: '',\n    label: '',").replace('    available: true,','    available: false,').replace('      )}`','      )}&service=${encodeURIComponent(serviceSlug)}`').replace('          if (firstAvail) setSelectedSlot(firstAvail);','          setSelectedSlot(firstAvail || {time:"",label:"",window:"MORNING",available:false});').replace('  }, [branchCode, selectedDate, dentistEmail]);','  }, [branchCode, selectedDate, dentistEmail, serviceSlug]);').replace('    setStep(7);',`    if (!dob || !consentChecked || !selectedSlot.available || loadingSlots) { setError(isAr ? 'أكمل بياناتك واختر موعداً متاحاً ووافق على الشروط.' : 'Complete your details, choose an available time and accept the terms.'); return; }
    setStep(7);`).replace('          branchCode,','          branchCode,\n          serviceSlug,\n          dateOfBirth:dob,\n          source:"WEBSITE",').replace('selectedSlotTime: selectedSlot.label','selectedSlotTime: selectedSlot.time').replace('                onClick={() => setStep(5)}','                disabled={loadingSlots || !selectedSlot.available}\n                onClick={() => setStep(5)}').replace('            {loadingSlots ? (','            {!loadingSlots && slots.length === 0 && <p role="status">{isAr ? "لا توجد مواعيد متاحة. اختر تاريخاً أو طبيباً آخر." : "No times available. Choose another date or dentist."}</p>}\n            {loadingSlots ? (').replace('`DTSTART:${startStr}`','`DTSTART;TZID=Africa/Cairo:${startStr}`').replace('`DTEND:${endStr}`','`DTEND;TZID=Africa/Cairo:${endStr}`').replace("      'BEGIN:VEVENT',","      'BEGIN:VEVENT',\n      'STATUS:TENTATIVE',"));
console.log('Connected shared booking and staff-only visit routes.');
