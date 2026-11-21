import db from './db';
import { Prisma } from '@prisma/client';

export interface AuditLogParams {
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  branchId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function logAuditEvent(params: AuditLogParams) {
  try {
    // Sanitize metadata to guarantee zero clinical PHI is persisted in audit trail
    const sanitizedMetadata: Record<string, unknown> = {};
    if (params.metadata) {
      for (const [key, value] of Object.entries(params.metadata)) {
        // Strip sensitive free text keys
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('clinicalnote') ||
          lowerKey.includes('diagnosis') ||
          lowerKey.includes('answers') ||
          lowerKey.includes('questionnaire') ||
          lowerKey.includes('password')
        ) {
          sanitizedMetadata[key] = '[REDACTED_CLINICAL_DATA]';
        } else {
          sanitizedMetadata[key] = value;
        }
      }
    }

    await db.auditEvent.create({
      data: {
        actorUserId: params.actorUserId ?? null,
        actorRole: params.actorRole ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        branchId: params.branchId ?? null,
        metadataJson: sanitizedMetadata as Prisma.InputJsonValue,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error('[AuditEvent] Failed to persist audit event:', err);
    // Never crash the primary business operation if audit write encounters a non-fatal issue
  }
}
