const fs=require('fs');
const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
fs.writeFileSync('src/app/appointments/request/page.tsx',`import { redirect } from 'next/navigation';
export default function AppointmentRequestPage(){redirect('/book');}
`);
fs.writeFileSync('src/components/AppointmentRequestModal.tsx',`'use client';
import Link from 'next/link';
import {useLanguage} from '@/context/LanguageContext';
interface AppointmentRequestModalProps {isOpen:boolean;onClose:()=>void;preselectedBranchCode?:string;preselectedService?:string;}
export function AppointmentRequestModal({isOpen,onClose,preselectedBranchCode,preselectedService}:AppointmentRequestModalProps){
 const {language}=useLanguage();if(!isOpen)return null;const ar=language==='ar';const params=new URLSearchParams();if(preselectedBranchCode)params.set('branch',preselectedBranchCode);if(preselectedService)params.set('service',preselectedService);
 return <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onKeyDown={e=>{if(e.key==='Escape')onClose()}}><section role="dialog" aria-modal="true" aria-labelledby="booking-title" className="surface-card max-w-lg w-full"><h2 id="booking-title">{ar?'حجز موعد':'Book an appointment'}</h2><p className="my-4">{ar?'اختر الفرع والطبيب والوقت المتاح لإرسال طلبك. يؤكد الاستقبال الحجز.':'Choose a branch, dentist and available time to send your request. Reception confirms your booking.'}</p><div className="flex gap-3"><Link onClick={onClose} href={'/book?'+params.toString()} className="primary-button">{ar?'اختيار موعد':'Choose a time'}</Link><button autoFocus className="secondary-button" onClick={onClose}>{ar?'إغلاق':'Close'}</button></div></section></div>
}
export default AppointmentRequestModal;
`);
edit('src/services/booking.service.ts',s=>s.replace("dentistUserId:{in:duties.map(d=>d.dentistUserId)}","OR:[{dentistUserId:{in:duties.map(d=>d.dentistUserId)}},{branchId}]").replace("serviceDescription?:string})","serviceDescription?:string}, acceptOfferedSlot=false)").replace("requireRole(actor,[Role.RECEPTIONIST,Role.OWNER_ADMIN],request.branchId);",`if(acceptOfferedSlot){await assertPatientSelf(actor.id,request.patientId);if(request.status!=='ALTERNATIVE_PROPOSED'||!request.alternativeOfferedDate||!request.alternativeOfferedTime)throw new Error('No pending offer.');selection={appointmentDate:request.alternativeOfferedDate,startTime:request.alternativeOfferedTime,dentistUserId:request.dentistPreferenceId||undefined};}else requireRole(actor,[Role.RECEPTIONIST,Role.OWNER_ADMIN],request.branchId);`).replace("if(!['REQUESTED','IN_REVIEW','AWAITING_PATIENT'].includes(request.status))","if(!acceptOfferedSlot && !['REQUESTED','IN_REVIEW','AWAITING_PATIENT'].includes(request.status))").replace("await tx.appointmentRequest.update({where:{id:requestId},data:{status:'CONFIRMED'}});",`if(request.rescheduleOfId){const original=await tx.appointment.findUniqueOrThrow({where:{id:request.rescheduleOfId}});if(original.patientId!==request.patientId||original.branchId!==request.branchId||original.status!=='CONFIRMED')throw new Error('The original booking can no longer be rescheduled.');await tx.appointment.update({where:{id:original.id},data:{status:'CANCELLED',cancellationReason:'Replacement booking confirmed'}});}
    await tx.appointmentRequest.update({where:{id:requestId},data:{status:'CONFIRMED'}});`));
edit('prisma/schema.prisma',s=>s.replace('model AppointmentRequest {','model AppointmentRequest {\n  rescheduleOfId String?'));
fs.mkdirSync('prisma/migrations/202611010002_preserve_reschedule',{recursive:true});fs.writeFileSync('prisma/migrations/202611010002_preserve_reschedule/migration.sql','ALTER TABLE "AppointmentRequest" ADD COLUMN "rescheduleOfId" TEXT;\n');
edit('src/services/visit.service.ts',s=>s.replace('await tx.arrivalEvent.findUnique({where:{id:existing.arrivalEventId!}})','existing.arrivalEventId ? await tx.arrivalEvent.findUnique({where:{id:existing.arrivalEventId}}) : null'));
edit('src/services/scheduling.service.ts',s=>{
s=s.replace("import { requireRole }", "import { assertPatientSelf, hasRole, requireRole }");s="import { cairoInstant } from '@/lib/scheduling-rules';\n"+s;
const a=s.indexOf('  // ACCEPT: Confirm the alternative slot'),b=s.indexOf('\n}\n',a);
s=s.slice(0,a)+`  const user=await db.user.findUniqueOrThrow({where:{id:actor.id},include:{roleGrants:true}});
  const appointment=await confirmBooking(requestId,user,undefined,true);
  return {request:await db.appointmentRequest.findUniqueOrThrow({where:{id:requestId}}),appointment};`+s.slice(b);
s=s.replace("  if (response === 'DECLINE') {", "  if(!['ACCEPT','DECLINE'].includes(response))throw new Error('Invalid response.');\n  await assertPatientSelf(actor.id,req.patientId);\n  if (response === 'DECLINE') {");
const start=s.indexOf('  // 24-hour cancellation policy'),end=s.indexOf('\n  return db.$transaction',start);
s=s.slice(0,start)+`  const user=await db.user.findUniqueOrThrow({where:{id:actor.id},include:{roleGrants:true}});
  const staff=hasRole(user,['RECEPTIONIST','OWNER_ADMIN'],appointment.branchId);
  if(!staff)await assertPatientSelf(actor.id,appointment.patientId);
  if(appointment.status!=='CONFIRMED')throw new Error('Only a confirmed appointment can be cancelled.');
  if(!staff || isPatientRequest){const policy=await db.schedulingPolicy.findUnique({where:{branchId:appointment.branchId}});const notice=policy?.cancellationNoticeHours??24;
    if((+cairoInstant(appointment.appointmentDate.toISOString().slice(0,10),appointment.startTime)-Date.now())/3600000<notice)throw new Error('Please contact reception to cancel within the cancellation notice period.');}
`+s.slice(end);
const rs=s.indexOf('export async function rescheduleAppointment');let tail=s.slice(rs);
const x=tail.indexOf('    // 1. Mark existing'),y=tail.indexOf('    // 2. Create',x);tail=tail.slice(0,x)+tail.slice(y);
tail=tail.replace('  return db.$transaction',`  const user=await db.user.findUniqueOrThrow({where:{id:actor.id},include:{roleGrants:true}});
  if(!hasRole(user,['RECEPTIONIST','OWNER_ADMIN'],appointment.branchId))await assertPatientSelf(actor.id,appointment.patientId);
  if(appointment.status!=='CONFIRMED'||!Number.isFinite(+newDate)||+newDate<Date.now()-86400000)throw new Error('Choose a future date for a confirmed appointment.');
  return db.$transaction`).replace('patientId: appointment.patientId,','rescheduleOfId: appointment.id,\n        patientId: appointment.patientId,').replace('metadata: { newRequestId: newRequest.id, newDate, preferredTimeWindow, reason }','metadata: { newRequestId: newRequest.id, newDate, preferredTimeWindow }');
return s.slice(0,rs)+tail;
});
