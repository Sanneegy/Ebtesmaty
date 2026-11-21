import { getOperationalUser } from '@/lib/operational-auth';
import { FollowUpAction } from '@/components/FollowUpAction';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import db from '@/lib/db';
import { cairoDate, dateOnly } from '@/lib/scheduling-rules';
import { cookies } from 'next/headers';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SmartClinicCalendar } from '@/components/phase1/SmartClinicCalendar';
import { UnifiedPatientFileView } from '@/components/phase1/InstantPatientSearchAndRecord';
import { AnatomicalExamChart } from '@/components/phase1/AnatomicalExamChart';
import { CbctAnd3DViewer } from '@/components/phase1/CbctAnd3DViewer';

export default async function ClinicalDesk({
  params,
  searchParams,
}: {
  params: { desk: string };
  searchParams: { date?: string; q?: string };
}) {
  const desk = params.desk;
  if (!['schedule', 'records', 'tasks'].includes(desk)) notFound();
  const u = await getOperationalUser();
  if (!u) redirect('/auth/login');
  if (!u.roleGrants.some((g) => g.role === 'DENTIST')) return <p>403</p>;
  const ar = cookies().get('ebtesamty_locale')?.value === 'ar';
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const day = searchParams.date || cairoDate();
  let date;
  try {
    date = dateOnly(day);
  } catch {
    notFound();
  }
  const name =
    desk === 'records'
      ? t('Patient Records', 'سجلات المرضى')
      : desk === 'schedule'
      ? t('My Schedule', 'جدولي')
      : t('Follow-ups & Tasks', 'المتابعات والمهام');

  const appointments =
    desk === 'schedule'
      ? await db.appointment.findMany({
          where: { dentistUserId: u.id, appointmentDate: date },
          include: { patient: { select: { fullName: true } }, branch: true, room: true },
          orderBy: { startTime: 'asc' },
        })
      : [];
  const duties =
    desk === 'schedule'
      ? await db.doctorDuty.findMany({
          where: { dentistUserId: u.id, dutyDate: date },
          include: { branch: true },
          orderBy: { startTime: 'asc' },
        })
      : [];
  const patients =
    desk === 'records'
      ? await db.patient.findMany({
          where: {
            careAssignments: { some: { dentistUserId: u.id, active: true } },
            OR: [
              { fullName: { contains: searchParams.q || '', mode: 'insensitive' } },
              { patientNumber: { contains: searchParams.q || '', mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            fullName: true,
            patientNumber: true,
            primaryBranch: { select: { name: true } },
          },
          orderBy: { fullName: 'asc' },
        })
      : [];
  const follow =
    desk === 'tasks'
      ? await db.followUp.findMany({
          where: { dentistUserId: u.id },
          include: { patient: { select: { fullName: true } } },
          orderBy: { recommendedDate: 'asc' },
        })
      : [];
  const reviews =
    desk === 'tasks'
      ? await db.medicalHistorySubmission.findMany({
          where: {
            status: 'PENDING_REVIEW',
            patient: { careAssignments: { some: { dentistUserId: u.id, active: true } } },
          },
          include: { patient: { select: { fullName: true } } },
        })
      : [];

  return (
    <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-100">
      <header className="rounded-3xl bg-slate-900/90 border border-slate-800 p-7 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#14B8A6]">
            {u.fullName}
          </p>
          <h1 className="text-3xl font-extrabold text-white mt-1">{name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dentist" className="secondary-button">
            {t('Clinical Cockpit', 'المساحة السريرية')}
          </Link>
        </div>
      </header>

      {desk === 'schedule' && (
        <>
          <div className="text-slate-900">
            <SmartClinicCalendar role="DENTIST" />
          </div>
          <form className="surface-card flex flex-wrap items-center gap-3">
            <label className="text-xs font-bold flex items-center gap-2">
              <span>{t('Clinic date', 'تاريخ العيادة')}</span>
              <input type="date" name="date" defaultValue={day} required className="field" />
            </label>
            <button className="primary-button">{t('Show schedule', 'عرض الجدول')}</button>
          </form>
          {duties.map((d) => (
            <p key={d.id} className="text-xs font-bold text-[#14B8A6] px-2">
              {d.branch.name} · {d.startTime}–{d.endTime}
            </p>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((a) => (
              <details className="surface-card space-y-2" key={a.id} open>
                <summary className="cursor-pointer font-extrabold text-white text-base">
                  <bdi>
                    {a.startTime}–{a.endTime}
                  </bdi>{' '}
                  · {a.patient.fullName}
                </summary>
                <p className="text-xs text-slate-400">
                  {a.serviceDescription} · {a.branch.name} · {a.room?.name || 'Operatory 1'}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <StatusBadge status={a.status} />
                  <Link className="secondary-button text-xs py-1.5 px-4" href={'/dentist/chart/' + a.patientId}>
                    {t('Open record', 'فتح السجل')}
                  </Link>
                </div>
              </details>
            ))}
          </div>
          {!appointments.length && (
            <p className="surface-card text-slate-400">
              {t('No appointments assigned on this date.', 'لا توجد مواعيد مسندة في هذا التاريخ.')}
            </p>
          )}
        </>
      )}

      {desk === 'records' && (
        <>
          <div className="space-y-6 text-slate-900">
            <UnifiedPatientFileView role="DENTIST" />
            <AnatomicalExamChart readOnly={false} />
            <CbctAnd3DViewer role="DENTIST" />
          </div>
          <form className="surface-card flex flex-wrap gap-3">
            <input
              className="field flex-1 max-w-md"
              aria-label={name}
              name="q"
              defaultValue={searchParams.q}
              placeholder={t('Patient name or file number', 'اسم المريض أو رقم الملف')}
            />
            <button className="primary-button">{t('Search', 'بحث')}</button>
          </form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patients.map((p) => (
              <div
                key={p.id}
                className="surface-card flex flex-wrap gap-4 items-center justify-between"
              >
                <div>
                  <b className="text-base text-white block">{p.fullName}</b>
                  <p className="text-xs text-slate-400 font-mono">
                    {p.patientNumber} · {p.primaryBranch?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link className="primary-button text-xs py-1.5 px-4" href={'/dentist/chart/' + p.id}>
                    {t('Dental chart', 'مخطط الأسنان')}
                  </Link>
                  <Link
                    className="secondary-button text-xs py-1.5 px-4"
                    href={'/dentist/chart/' + p.id + '?tab=intake'}
                  >
                    {t('Medical forms', 'التاريخ الطبي')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {!patients.length && (
            <p className="surface-card text-slate-400">
              {t('No matching assigned patients.', 'لا توجد ملفات مطابقة.')}
            </p>
          )}
        </>
      )}

      {desk === 'tasks' && (
        <div className="space-y-6">
          <section className="surface-card space-y-3">
            <h2 className="text-white">{t('Medical forms awaiting review', 'استمارات بانتظار المراجعة')}</h2>
            {reviews.map((r) => (
              <Link
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-[#14B8A6] text-xs font-bold text-slate-200"
                key={r.id}
                href={'/dentist/chart/' + r.patientId + '?tab=intake'}
              >
                <span>{r.patient.fullName}</span>
                <span className="text-[#14B8A6]">{t('Review form →', 'مراجعة الاستمارة ←')}</span>
              </Link>
            ))}
            {!reviews.length && (
              <p className="text-xs text-slate-400">
                {t('No forms awaiting review.', 'لا توجد استمارات بانتظار المراجعة.')}
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-white">{t('Follow-up list', 'قائمة المتابعات')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {follow.map((f) => (
                <div className="surface-card space-y-3" key={f.id}>
                  <div className="flex items-center justify-between">
                    <b className="text-white">{f.patient.fullName}</b>
                    <StatusBadge status={f.status} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {f.procedureType} · {cairoDate(f.recommendedDate)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <FollowUpAction id={f.id} status={f.status} />
                    <Link
                      className="secondary-button text-xs py-1.5 px-4"
                      href={'/dentist/chart/' + f.patientId + '?tab=treatment'}
                    >
                      {t('Review care plan', 'مراجعة خطة العلاج')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {!follow.length && (
              <p className="surface-card text-slate-400">
                {t('No follow-ups assigned.', 'لا توجد متابعات مسندة.')}
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
