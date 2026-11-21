const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('tests/integration/critical_workflow_regressions.test.ts',s=>s.replace("movementType:'ADJUSTMENT'","movementType:'COUNT_ADJUSTMENT'").replace("await db.doctorDuty.create", "await db.appointment.deleteMany({where:{dentistUserId:dentist.id,appointmentDate:dateOnly(day),serviceDescription:'Test consultation'}});await db.doctorDuty.create"));
edit('src/app/inventory/page.tsx',s=>`import {branchScope} from '@/lib/rbac';
import {EquipmentDeskClient} from '@/app/operations/equipment/EquipmentDeskClient';
import {getEquipmentAssets,getEquipmentSummary,getWorkOrders} from '@/services/equipment.service';
`+s.replace('InventoryPage()','InventoryPage({searchParams}:{searchParams:{view?:string}})').replace('where: { isActive: true },',"where: { isActive: true, id:branchScope(user,['INVENTORY','OWNER_ADMIN']) },").replace("  const [materials, suppliers]",`  if(searchParams.view==='equipment'){const id=branches[0]?.id;if(!id)return <p>No authorized branch.</p>;const [assets,summary,orders]=await Promise.all([getEquipmentAssets(id),getEquipmentSummary(id),getWorkOrders(id)]);return <EquipmentDeskClient currentUser={user} branches={branches} initialAssets={assets} initialSummary={summary} initialWorkOrders={orders}/>;}
  const [materials, suppliers]`));
fs.writeFileSync('src/app/operations/equipment/page.tsx',"import {redirect} from 'next/navigation';\nexport default function EquipmentPage(){redirect('/inventory?view=equipment');}\n");
edit('src/config/workspace-navigation.ts',s=>s.replace("{ id: 'procurement-desk',", "{id:'equipment-records',labelEn:'Equipment records',labelAr:'سجلات الأجهزة',href:'/inventory?view=equipment',iconName:'Boxes'},\n      { id: 'procurement-desk',"));
edit('src/services/booking.service.ts',s=>s.replace('    const result=await availability',`    const duties=await tx.doctorDuty.findMany({where:{branchId:request.branchId,dutyDate:{gte:dateOnly(day),lt:new Date(+dateOnly(day)+86400000)}}});
    for(const id of [...new Set(duties.map(d=>d.dentistUserId))].sort())await tx.$executeRaw\`SELECT pg_advisory_xact_lock(hashtext(\${'dentist:'+id+':'+day}))\`;
    const result=await availability`));
