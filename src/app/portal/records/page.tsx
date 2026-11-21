import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { PatientRecords } from '@/components/PatientRecords';
import { getPatientClinicalSummary } from '@/services/clinical.service';

export default async function RecordsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const link = await db.portalPatientLink.findFirst({
    where: { userId: user.id, status: 'APPROVED' },
  });

  const plans = link
    ? await db.treatmentPlan.findMany({
        where: { patientId: link.patientId, status: { in: ['PROPOSED', 'ACCEPTED', 'COMPLETED'] } },
        select: {
          id: true,
          title: true,
          status: true,
          notes: true,
          items: {
            select: {
              id: true,
              procedureName: true,
              toothNumber: true,
              estimatedCostPiasters: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const summary = link ? await getPatientClinicalSummary(link.patientId) : null;

  return (
    <PatientRecords
      plans={plans}
      patientId={link?.patientId || null}
      branchId={summary?.patient?.primaryBranchId || null}
      toothChart={summary?.toothChart || {}}
      documents={summary?.documents || []}
      prescriptions={summary?.prescriptions || []}
    />
  );
}
