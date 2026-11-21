import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { FileCategory } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getOperationalUser } from '@/lib/operational-auth';
import { requireClinicalAccess, requireRole } from '@/lib/rbac';
import { getPatientDocuments, recordDocumentMetadata } from '@/services/clinical.service';

const directory = process.env.CLINICAL_FILE_DIRECTORY || path.join(process.cwd(), '.private', 'clinical-files');
const limit = 10 * 1024 * 1024;
const failure = (message: string, status: number) => NextResponse.json({error:message}, {status});

export async function GET(request: NextRequest) {
  const actor = await getOperationalUser();
  if (!actor) return failure('Sign in required', 401);
  const params = request.nextUrl.searchParams;
  try {
    const id = params.get('id');
    if (id) {
      const doc = await db.documentMetadata.findUniqueOrThrow({where:{id}});
      await requireClinicalAccess(actor, doc.patientId);
      requireRole(actor, ['DENTIST'], doc.branchId);
      if (!/^private:[0-9a-f-]{36}$/.test(doc.storageKey)) return failure('File unavailable',404);
      const bytes = await readFile(path.join(directory,doc.storageKey.slice(8)));
      return new Response(new Uint8Array(bytes), {headers:{
        'Content-Type': doc.fileMime,
        'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(doc.fileName),
        'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff'
      }});
    }
    const patientId = params.get('patientId');
    if (!patientId) return failure('Choose a patient',400);
    await requireClinicalAccess(actor, patientId);
    return NextResponse.json({documents:await getPatientDocuments(patientId, params.get('category') as FileCategory || undefined)});
  } catch (error: any) {
    return failure(error.statusCode === 403 ? 'Access denied' : 'File unavailable', error.statusCode || 404);
  }
}

export async function POST(request: NextRequest) {
  const actor = await getOperationalUser();
  if (!actor) return failure('Sign in required',401);
  try {
    requireRole(actor,['DENTIST']);
    if (Number(request.headers.get('content-length')) > limit + 65536) return failure('Maximum file size is 10 MB',413);
    const form = await request.formData();
    const patientId = String(form.get('patientId') || '');
    const branchId = String(form.get('branchId') || '');
    requireRole(actor,['DENTIST'],branchId);
    await requireClinicalAccess(actor,patientId);
    const file = form.get('file');
    const category = String(form.get('fileCategory'));
    if (!file || typeof file === 'string' || !file.size || file.size > limit || !(Object.values(FileCategory) as string[]).includes(category))
      return failure('Choose a category and a file up to 10 MB',400);
    const bytes = Buffer.from(await file.arrayBuffer());
    const mime = bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')) ? 'image/png'
      : bytes.subarray(0,3).equals(Buffer.from('ffd8ff','hex')) ? 'image/jpeg'
      : bytes.subarray(0,5).toString() === '%PDF-' ? 'application/pdf' : undefined;
    if (!mime) return failure('Choose a PNG, JPEG or PDF file',415);
    const key = randomUUID();
    await mkdir(directory,{recursive:true});
    const destination = path.join(directory,key);
    await writeFile(destination,bytes,{flag:'wx',mode:0o600});
    try {
      const document = await recordDocumentMetadata({patientId,branchId,fileName:path.basename(file.name).slice(0,200),fileMime:mime,fileCategory:category as FileCategory,fileSizeBytes:bytes.length,storageKey:'private:'+key,uploadedByUserId:actor.id,notes:String(form.get('notes') || '').slice(0,2000)});
      return NextResponse.json({document},{status:201});
    } catch (error) {
      await unlink(destination);
      throw error;
    }
  } catch (error: any) {
    return failure(error.statusCode === 403 ? 'Access denied' : 'Could not save the attachment',error.statusCode || 400);
  }
}
