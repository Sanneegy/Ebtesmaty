import {NextResponse} from 'next/server';
import {z} from 'zod';
import db from '@/lib/db';
import {getOperationalUser} from '@/lib/operational-auth';
import {requireRole} from '@/lib/rbac';
const input=z.discriminatedUnion('action',[z.object({action:z.literal('CONTACT'),caseId:z.string(),note:z.string().trim().min(1).max(500)}),z.object({action:z.literal('LINK'),caseId:z.string(),requestId:z.string(),verified:z.literal(true)})]);
export async function POST(req:Request){const actor=await getOperationalUser();if(!actor)return NextResponse.json({error:'Sign in required'},{status:401});try{const body=input.parse(await req.json());const saved=await db.$transaction(async tx=>{
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'lead:'+body.caseId}))`;
 const lead=await tx.feedbackCase.findUniqueOrThrow({where:{id:body.caseId}});requireRole(actor,['CRM','RECEPTIONIST'],lead.branchId);if(lead.category!=='INQUIRY')throw Error('Choose an inquiry.');
 if(body.action==='LINK'){const r=await tx.appointmentRequest.findUniqueOrThrow({where:{id:body.requestId},include:{appointment:true}});if(!r.appointment||r.branchId!==lead.branchId||(lead.patientId&&r.patientId!==lead.patientId)||r.createdAt<lead.createdAt||lead.linkedRequestId)throw Error('Booking cannot be linked to this inquiry.');await tx.feedbackCase.update({where:{id:lead.id},data:{patientId:r.patientId,linkedRequestId:r.id}});}
 await tx.inquiryActivity.create({data:{caseId:lead.id,actorUserId:actor.id,note:body.action==='LINK'?'Booking linked':body.note}});
 await tx.auditEvent.create({data:{actorUserId:actor.id,action:'CRM_'+body.action,entityType:'FeedbackCase',entityId:lead.id,branchId:lead.branchId}});
 return tx.feedbackCase.findUniqueOrThrow({where:{id:lead.id},include:{branch:true,patient:{select:{fullName:true,patientNumber:true}},linkedRequest:{include:{appointment:{select:{status:true}}}},activities:{orderBy:{createdAt:'desc'}}}});
 });return NextResponse.json({case:saved});}catch(e:any){return NextResponse.json({error:e.code==='P2002'?'This booking already has an originating inquiry.':e.name==='ZodError'?'Check the activity details.':e.message},{status:e.statusCode||400})}}
