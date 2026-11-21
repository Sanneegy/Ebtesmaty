import { getOperationalUser } from '@/lib/operational-auth';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { branchScope } from '@/lib/rbac';
import { dateOnly, cairoDate } from '@/lib/scheduling-rules';
import { FrontDeskBook } from '@/components/FrontDeskBook';
import { SmartClinicCalendar } from '@/components/phase1/SmartClinicCalendar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import RequestInbox from './RequestInbox';

export default async function Agenda({
  searchParams: q,
}: {
  searchParams: { date?: string; branch?: string; range?: string; inbox?: string; dentist?: string };
}) {
  const u = await getOperationalUser();
  if (!u) redirect('/auth/login');
  if (!u.roleGrants.some((g) => g.role === 'RECEPTIONIST' || g.role === 'OWNER_ADMIN')) return <p>403</p>;

  const scope = branchScope(u, ['RECEPTIONIST', 'OWNER_ADMIN']);
  const branches = await db.branch.findMany({ where: { id: scope, isActive: true }, orderBy: { code: 'asc' } });
  const branch = branches.find((b) => b.id === q.branch) || branches[0];
  if (!branch) notFound();

  const ar = cookies().get('ebtesamty_locale')?.value === 'ar';
  const t = (a: string, b: string) => (ar ? b : a);
  let start: Date;
  try {
    start = dateOnly(q.date || cairoDate());
  } catch {
    notFound();
  }

  const range = q.range || 'week';
  const daysSpan = range === 'month' ? 30 : range === 'week' ? 7 : 1;
  const end = new Date(+start + daysSpan * 86400000);

  const doctors = await db.user.findMany({
    where: { roleGrants: { some: { role: 'DENTIST', branchId: branch.id } } },
    select: { id: true, fullName: true },
  });

  if (q.inbox === '1') return <RequestInbox branchCode={branch.code} doctors={doctors} />;

  const appointments = await db.appointment.findMany({
    where: {
      branchId: branch.id,
      appointmentDate: { gte: start, lt: end },
      dentistUserId: q.dentist || undefined,
    },
    include: {
      patient: { select: { fullName: true, patientNumber: true } },
      dentistUser: { select: { fullName: true } },
      room: true,
    },
    orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(+start + i * 86400000);
    return {
      iso: d.toISOString().slice(0, 10),
      dayName: d.toLocaleDateString(ar ? 'ar-EG' : 'en-US', { weekday: 'short', timeZone: 'Africa/Cairo' }),
      dayNum: d.getUTCDate(),
    };
  });

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
  const cardPalette = [
    'bg-blue-100/90 border-blue-300 text-blue-950',
    'bg-emerald-100/90 border-emerald-300 text-emerald-950',
    'bg-violet-100/90 border-violet-300 text-violet-950',
    'bg-amber-100/90 border-amber-300 text-amber-950',
  ];

  return (
    <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <header className="bento-card flex flex-wrap justify-between items-center gap-4">
        <div>
          <small className="font-extrabold uppercase tracking-wider text-[#C8A96E]">{branch.name}</small>
          <h1 className="text-3xl font-extrabold text-[#0B2528]">{t('Appointments & Calendar', 'المواعيد والتقويم')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'Day, Week, and Month views · Server-side dentist & room conflict prevention · Google Calendar busy-sync ready',
              'عرض يومي وأسبوعي وشهري · منع تعارض الأطباء والغرف · جاهز لمزامنة تقويم جوجل'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full bg-[#F7F6F2] p-1 border border-slate-200/80">
            {(['day', 'week', 'month'] as const).map((rMode) => (
              <Link
                key={rMode}
                href={`/reception/agenda?branch=${branch.id}&date=${cairoDate(start)}&range=${rMode}${q.dentist ? `&dentist=${q.dentist}` : ''}`}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all active:scale-95 ${
                  range === rMode ? 'bg-[#0B2528] text-white shadow-xs' : 'text-slate-700 hover:bg-white'
                }`}
              >
                {rMode === 'day' ? t('Day', 'يوم') : rMode === 'week' ? t('Week', 'أسبوع') : t('Month', 'شهر')}
              </Link>
            ))}
          </div>
          <FrontDeskBook branches={[branch]} />
        </div>
      </header>

      <form className="surface-card flex flex-wrap gap-3 items-end">
        <label className="text-xs font-bold">
          {t('Branch', 'الفرع')}
          <select className="field mt-1" name="branch" defaultValue={branch.id}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold">
          {t('Starting date', 'من تاريخ')}
          <input className="field mt-1" type="date" name="date" defaultValue={cairoDate(start)} required />
        </label>
        <label className="text-xs font-bold">
          {t('View', 'العرض')}
          <select className="field mt-1" name="range" defaultValue={range}>
            <option value="day">{t('Day', 'يوم')}</option>
            <option value="week">{t('Week', 'أسبوع')}</option>
            <option value="month">{t('Month', 'شهر')}</option>
          </select>
        </label>
        <label className="text-xs font-bold">
          {t('Dentist', 'الطبيب')}
          <select className="field mt-1" name="dentist" defaultValue={q.dentist}>
            <option value="">{t('All dentists', 'جميع الأطباء')}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button">{t('Show appointments', 'عرض المواعيد')}</button>
        <Link className="secondary-button" href={`/reception/agenda?branch=${branch.id}&date=${cairoDate()}&range=${range}`}>
          {t('Today', 'اليوم')}
        </Link>
        <Link className="secondary-button" href={'/reception/agenda?inbox=1&branch=' + branch.id}>
          {t('Review booking requests', 'مراجعة طلبات الحجز')}
        </Link>
      </form>

      {/* PHASE 1 SMART CLINIC CALENDAR (Image 4: Multi-Column / Weekly Color-Coded Drag & Drop Calendar
          with Automatic Clash Prevention + Image 5: Clinic WhatsApp Automatic Reminders & Replies
          + Image 6: Waiting List That Fills Cancellations) */}
      <SmartClinicCalendar role="RECEPTIONIST" />

      {/* WEEKLY CALENDAR TIME-GRID (Matching Receptionist Dashboard Reference Board) */}
      {range === 'week' && (
        <section className="surface-card overflow-x-auto">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-8 border-b border-slate-200 pb-3 mb-2 text-center">
              <div className="text-xs font-bold text-slate-400 self-end">{t('Time', 'الوقت')}</div>
              {weekDays.map((wd) => {
                const isToday = wd.iso === cairoDate();
                return (
                  <div key={wd.iso} className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 block">{wd.dayName}</span>
                    <span
                      className={`inline-flex w-8 h-8 items-center justify-center rounded-xl text-sm font-extrabold ${
                        isToday ? 'bg-[#4169E1] text-white' : 'text-[#102A5E]'
                      }`}
                    >
                      {wd.dayNum}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="divide-y divide-slate-100">
              {timeSlots.map((slotHour) => {
                const hourPrefix = slotHour.slice(0, 2);
                return (
                  <div key={slotHour} className="grid grid-cols-8 min-h-[72px] items-stretch">
                    <div className="py-3 px-2 text-xs font-mono text-slate-400 text-center border-e border-slate-100">
                      {slotHour}
                    </div>
                    {weekDays.map((wd, dayIdx) => {
                      const cellAppts = appointments.filter(
                        (a) =>
                          a.appointmentDate.toISOString().slice(0, 10) === wd.iso &&
                          a.startTime.startsWith(hourPrefix)
                      );
                      return (
                        <div key={wd.iso + slotHour} className="p-1.5 border-e border-slate-50 space-y-1.5">
                          {cellAppts.map((a, idx) => (
                            <div
                              key={a.id}
                              className={`p-2 rounded-xl border text-[11px] leading-snug shadow-2xs ${
                                cardPalette[(dayIdx + idx) % cardPalette.length]
                              }`}
                            >
                              <strong className="block truncate">{a.patient.fullName}</strong>
                              <span className="block truncate opacity-85">{a.serviceDescription}</span>
                              <span className="block text-[10px] font-mono opacity-75">
                                {a.startTime} · {a.dentistUser.fullName.split(' ').slice(0, 2).join(' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* DETAILED APPOINTMENT LIST (Preserved for all views & tests) */}
      <div className="space-y-3">
        {appointments.map((a) => (
          <details className="surface-card" key={a.id}>
            <summary className="font-semibold cursor-pointer">
              {cairoDate(a.appointmentDate)} · <bdi>{a.startTime}–{a.endTime}</bdi> · {a.patient.fullName} ·{' '}
              {a.dentistUser.fullName}
            </summary>
            <p className="mt-2 text-sm text-slate-600">
              {a.serviceDescription} · {a.patient.patientNumber} · {a.room?.name || 'Operatory 1'}
            </p>
            <div className="mt-2">
              <StatusBadge status={a.status} />
            </div>
          </details>
        ))}
        {!appointments.length && (
          <p className="surface-card">{t('No bookings match this calendar selection.', 'لا توجد حجوزات مطابقة لاختيارك.')}</p>
        )}
      </div>
    </main>
  );
}
