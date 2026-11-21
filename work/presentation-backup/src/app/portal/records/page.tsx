import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { PatientRecords } from '@/components/PatientRecords';
export default async function RecordsPage() { const user = await getCurrentUser(); if (!user)
    redirect('/auth/login'); const link = await db.portalPatientLink.findFirst({ where: { userId: user.id, status: 'APPROVED' } }); const plans = link ? await db.treatmentPlan.findMany({ where: { patientId: link.patientId, status: { in: ['ACCEPTED', 'COMPLETED'] } }, select: { id: true, title: true, status: true, items: { select: { id: true, procedureName: true, estimatedCostPiasters: true, status: true } } }, orderBy: { createdAt: 'desc' } }) : []; return <PatientRecords plans={plans}/>; }
