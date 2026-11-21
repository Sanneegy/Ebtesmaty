import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import db from '@/lib/db';
import {getOperationalUser} from '@/lib/operational-auth';
import {requireRole} from '@/lib/rbac';
const policy=z.object({materialId:z.string().min(1),leadTimeDays:z.number().int().min(0).max(3650)});
export async function PATCH(request:NextRequest){
 const actor=await getOperationalUser();
 if(!actor)return NextResponse.json({error:'Sign in required'},{status:401});
 try{
  requireRole(actor,['INVENTORY']);
  const input=policy.parse(await request.json());
  const material=await db.$transaction(async tx=>{
   const updated=await tx.material.update({where:{id:input.materialId},data:{leadTimeDays:input.leadTimeDays}});
   await tx.auditEvent.create({data:{actorUserId:actor.id,action:'MATERIAL_LEAD_TIME_UPDATED',entityType:'Material',entityId:updated.id,metadataJson:{leadTimeDays:input.leadTimeDays}}});
   return updated;
  });
  return NextResponse.json({material});
 }catch(error:any){return NextResponse.json({error:error.statusCode===403?'Inventory access required':'Enter a lead time between 0 and 3650 days'},{status:error.statusCode||400})}
}
