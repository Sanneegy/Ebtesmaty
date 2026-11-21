import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { PortalFeedbackClient } from './PortalFeedbackClient';

export default async function PortalFeedbackPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const branches = await db.branch.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });

  const link = await db.portalPatientLink.findFirst({
    where: { userId: user.id, status: 'APPROVED' },
    include: { patient: true },
  });

  const cases = link?.patientId
    ? await db.feedbackCase.findMany({
        where: { patientId: link.patientId },
        include: { branch: true },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  return (
    <PortalFeedbackClient
      currentUser={user}
      patientId={link?.patientId || null}
      branches={branches}
      initialCases={cases}
    />
  );
}
