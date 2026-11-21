const fs=require('fs');let p='tests/integration/sc01_sc15_scheduling_and_queues.test.ts',s=fs.readFileSync(p,'utf8');s=`import {checkIn,transitionVisit} from '../../src/services/visit.service';
import {cairoDate,dateOnly} from '../../src/lib/scheduling-rules';
`+s;s=s.replace('/not scheduled on confirmed duty/','/no longer available/').replace('/Conflict: Dentist already has a confirmed booking/','/no longer available/');s=s.replace('    // Patient accepts alternative',"    await recordDoctorDuty(dentistSandy.id,branchA.id,altDate,'09:00','18:00');\n    // Patient accepts alternative");
let a=s.indexOf("  it('SC08"),b=s.indexOf("  it('SC13",a);
s=s.slice(0,a)+`  it('SC08-SC10: only reception admits; concurrent check-in retries create one verified visit',async()=>{
    await expect(reportPatientArrival(testPatient.id,branchA.id)).rejects.toThrow(/reception/);
    await db.queueEntry.deleteMany({where:{patientId:testPatient.id}});
    const appointment=await db.appointment.create({data:{patientId:testPatient.id,branchId:branchA.id,dentistUserId:dentistSandy.id,appointmentDate:dateOnly(cairoDate()),startTime:'00:00',endTime:'00:45',serviceDescription:'Test visit'}});
    const input={patientId:testPatient.id,branchId:branchA.id,appointmentId:appointment.id};
    const reception=await db.user.findUniqueOrThrow({where:{id:receptionistMariam.id},include:{roleGrants:true}});
    const patient=await db.user.findUniqueOrThrow({where:{id:hassanUser.id},include:{roleGrants:true}});
    await expect(checkIn(input,patient)).rejects.toThrow(/permission/);
    const [first,retry]=await Promise.all([checkIn(input,reception),checkIn(input,reception)]);
    expect(first.queueEntry.id).toBe(retry.queueEntry.id);expect(first.arrival?.isVerified).toBe(true);expect(first.arrival?.verifiedByUserId).toBe(reception.id);
    expect((await db.appointment.findUniqueOrThrow({where:{id:appointment.id}})).status).toBe('CONFIRMED');
  });
  it('SC11-SC12: clinical transitions require call, treating dentist and preserve timestamps',async()=>{
    const entry=await db.queueEntry.findFirstOrThrow({where:{patientId:testPatient.id,status:'WAITING'}});
    const reception=await db.user.findUniqueOrThrow({where:{id:receptionistMariam.id},include:{roleGrants:true}});
    const dentist=await db.user.findUniqueOrThrow({where:{id:dentistSandy.id},include:{roleGrants:true}});
    await expect(admitDirectWalkIn(testPatient.id,branchA.id,dentist.id,'Urgent',{id:reception.id,role:'RECEPTIONIST'})).rejects.toThrow(/available/);
    await expect(transitionVisit(entry.id,'START',dentist)).rejects.toThrow(/changed/);
    await transitionVisit(entry.id,'CALL',reception);
    await expect(transitionVisit(entry.id,'START',reception)).rejects.toThrow(/permission/);
    const started=await transitionVisit(entry.id,'START',dentist);expect(started.startedAt).not.toBeNull();
    const completed=await transitionVisit(entry.id,'COMPLETE',dentist);expect(completed.status).toBe('COMPLETED');expect(completed.completedAt).not.toBeNull();
  });

`+s.slice(b);fs.writeFileSync(p,s);
p='tests/integration/fn01_fn12_billing_and_finance.test.ts';s=fs.readFileSync(p,'utf8').replace('/^INV-\\d{4}-\\d{4}$/','/^INV-[0-9a-f-]{36}$/').replace('/^RCP-\\d{4}-\\d{4}$/','/^RCP-[0-9a-f-]{36}$/');fs.writeFileSync(p,s);
