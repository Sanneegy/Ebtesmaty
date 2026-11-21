import {getOperationalUser} from '@/lib/operational-auth';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import db from '@/lib/db';
import { getQueuePolicy } from '@/services/visit.service';
import { z } from 'zod';
const schema=z.object({branchId:z.string().min(1),earlyArrivalMinutes:z.number().int().min(0).max(120),lateGraceMinutes:z.number().int().min(0).max(180).nullable(),lateAction:z.enum(['STAFF_REVIEW','RESCHEDULE']),walkInsEnabled:z.boolean(),cancellationNoticeHours:z.number().int().min(0).max(168)});
export async function GET(req:Request){try{const user=await getOperationalUser();const branchId=new URL(req.url).searchParams.get('branchId')||'';requireRole(user,['RECEPTIONIST','DENTIST','OWNER_ADMIN','SYSTEM_ADMIN'],branchId);return NextResponse.json(await getQueuePolicy(branchId));}catch(e:any){return NextResponse.json({error:e.message},{status:e.statusCode||400});}}
export async function PUT(req:Request){try{const user=await getOperationalUser();requireRole(user,['OWNER_ADMIN','SYSTEM_ADMIN']);const data=schema.parse(await req.json());await db.branch.findUniqueOrThrow({where:{id:data.branchId}});const policy=await db.$transaction(async tx=>{const saved=await tx.schedulingPolicy.upsert({where:{branchId:data.branchId},create:{...data,updatedByUserId:user!.id},update:{...data,updatedByUserId:user!.id}});await tx.auditEvent.create({data:{actorUserId:user!.id,action:'QUEUE_POLICY_UPDATED',entityType:'SchedulingPolicy',entityId:data.branchId,branchId:data.branchId,metadataJson:data}});return saved;});return NextResponse.json(policy);}catch(e:any){return NextResponse.json({error:e.message},{status:e.statusCode||400});}}
