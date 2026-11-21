import {requireClinicalAccess} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role, FileCategory } from '@prisma/client';
import { recordDocumentMetadata, getPatientDocuments } from '@/services/clinical.service';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  const category = searchParams.get('category') as FileCategory | null;

  if (!patientId) {
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
  }

  try {
    await requireClinicalAccess(user, patientId);
    const docs = await getPatientDocuments(patientId, category || undefined);
    return NextResponse.json({ documents: docs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch documents' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    requireRole(user, [Role.DENTIST, Role.RECEPTIONIST, Role.BRANCH_MANAGER, Role.OWNER_ADMIN]);
    const body = await req.json();
    const { patientId, branchId, encounterId, fileName, fileMime, fileSizeBytes, fileCategory, storageKey, notes } = body;
    await requireClinicalAccess(user, patientId);

    if (!patientId || !branchId || !fileName || !fileMime || !fileSizeBytes || !fileCategory) {
      return NextResponse.json({ error: 'Missing required document metadata fields' }, { status: 400 });
    }

    const doc = await recordDocumentMetadata({
      patientId,
      branchId,
      encounterId,
      fileName,
      fileMime,
      fileSizeBytes: Number(fileSizeBytes),
      fileCategory: fileCategory as FileCategory,
      storageKey: storageKey || `vault/branches/${branchId}/patients/${patientId}/${Date.now()}_${fileName}`,
      uploadedByUserId: user.id,
      notes,
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record document metadata' }, { status: 400 });
  }
}
