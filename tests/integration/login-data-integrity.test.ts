import {describe,it,expect,beforeAll} from 'vitest';
import {randomUUID} from 'crypto';
import db from '@/lib/db';
import {submitBooking} from '@/services/booking.service';
import {dateOnly} from '@/lib/scheduling-rules';
import {loginDestination} from '@/lib/login-destination';
import {normalizePhone} from '@/lib/phone';
import {hasRole} from '@/lib/rbac';
describe('Presentation access and submission integrity',()=>{
 it('normalizes Egyptian phone formatting without changing patient identity',()=>{expect(normalizePhone('010 1234 5678')).toBe('+201012345678');expect(normalizePhone('00201012345678')).toBe('+201012345678');});
 it('routes department roles without granting owner authority',()=>{for(const [role,path] of Object.entries({PATIENT:'/portal',RECEPTIONIST:'/reception',DENTIST:'/dentist',OWNER_ADMIN:'/management',FINANCE:'/billing',INVENTORY:'/inventory',CRM:'/crm',SYSTEM_ADMIN:'/admin'})){expect(loginDestination([{role}])).toBe(path);}expect(hasRole({roleGrants:[{role:'SYSTEM_ADMIN',branchId:null}]},['DENTIST'])).toBe(false);expect(loginDestination([])).toBe(null);});
 it('concurrent public retries create one patient and one request, and reject changed details',async()=>{
 const branch=await db.branch.findUniqueOrThrow({where:{code:'BR-A'}}),dentist=await db.user.findUniqueOrThrow({where:{email:'dr.sandy@ebtesamty.dev'}});const day='2038-05-15';
 await db.doctorDuty.create({data:{branchId:branch.id,dentistUserId:dentist.id,dutyDate:dateOnly(day),startTime:'09:00',endTime:'15:00',status:'CONFIRMED'}});
 const input={submissionKey:randomUUID(),branchId:branch.id,fullName:'Retry verification fixture',phone:'+201011122233',dateOfBirth:'1992-01-01',day,time:'09:00',dentistId:dentist.id,serviceName:'Consultation',source:'WEBSITE' as const};
 const [a,b]=await Promise.all([submitBooking(input,null),submitBooking(input,null)]);expect(a.id).toBe(b.id);expect(a.patientId).toBe(b.patientId);expect(await db.appointmentRequest.count({where:{submissionKey:input.submissionKey}})).toBe(1);await expect(submitBooking({...input,fullName:'Changed identity'},null)).rejects.toThrow('different details');
 });
});
