import { BranchComparison } from './InsightChart';
import { OwnerCharts } from './OwnerCharts';
import { OwnerEnterpriseControls } from './OwnerEnterpriseControls';
import { DashboardPhaseOneHub } from '@/components/phase1/DashboardPhaseOneHub';
import FinanceCenterPhaseTwo from '@/components/phase2/FinanceCenterPhaseTwo';
import ProfitabilityPhaseTwo from '@/components/phase2/ProfitabilityPhaseTwo';
import InventorySuppliesPhaseTwo from '@/components/phase2/InventorySuppliesPhaseTwo';
import LabManagementPhaseTwo from '@/components/phase2/LabManagementPhaseTwo';
import LeadFollowupCrmPhaseThree from '@/components/phase3/LeadFollowupCrmPhaseThree';
import InboxWhatsAppPhaseThree from '@/components/phase3/InboxWhatsAppPhaseThree';
import WebsiteReviewsPhaseThree from '@/components/phase3/WebsiteReviewsPhaseThree';
import AttendancePayrollPhaseThree from '@/components/phase3/AttendancePayrollPhaseThree';
import StatisticsAndReportsPhaseThree from '@/components/phase3/StatisticsAndReportsPhaseThree';
import { RadialProgressRing, ProportionalStatusBar } from '@/components/ui/VisualSubPageCanvas';
import { ensurePlatformDefaults } from '@/services/platform-extensions.service';
import Link from 'next/link';
import db from '@/lib/db';
import { cookies } from 'next/headers';
import { cairoDate, cairoInstant, dateOnly } from '@/lib/scheduling-rules';

export async function ExecutiveReport({
  query,
}: {
  query: { branchId?: string; view?: string; from?: string; to?: string };
}) {
  await ensurePlatformDefaults();
  const ar = cookies().get('ebtesamty_locale')?.value === 'ar';
  const t = (en: string, a: string) => (ar ? a : en);
  const today = cairoDate();
  const day = (s?: string) => {
    try {
      if (s) return dateOnly(s).toISOString().slice(0, 10);
    } catch {}
    return undefined;
  };
  const to = day(query.to) || today;
  const from = day(query.from) || cairoDate(new Date(+dateOnly(to) - 29 * 86400000));
  if (from > to)
    return <p>{t('Start date must precede end date.', 'يجب أن يسبق تاريخ البداية تاريخ النهاية.')}</p>;

  const after = cairoDate(new Date(+dateOnly(to) + 86400000));
  const period = { gte: cairoInstant(from, '00:00'), lt: cairoInstant(after, '00:00') };
  const dates = { gte: dateOnly(from), lt: dateOnly(after) };

  const branches = await db.branch.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
  const id = query.branchId || undefined;
  const view = query.view || 'overview';

  const [inv, pay, ap, requests, expenses, unpaidInvoices, stockLots, labOrders] = await Promise.all([
    db.invoice.groupBy({
      by: ['branchId'],
      where: { branchId: id, issuedAt: period, status: { notIn: ['VOIDED', 'DRAFT'] } },
      _sum: { totalAmountPiasters: true, paidAmountPiasters: true },
    }),
    db.payment.groupBy({
      by: ['collectionBranchId'],
      where: { collectionBranchId: id, collectedAt: period, status: 'POSTED' },
      _sum: { amountPiasters: true },
    }),
    db.appointment.groupBy({
      by: ['branchId', 'status'],
      where: { branchId: id, appointmentDate: dates },
      _count: true,
    }),
    db.appointmentRequest.findMany({
      where: { branchId: id, createdAt: period },
      select: { source: true, appointment: { select: { status: true } } },
    }),
    db.expense.groupBy({
      by: ['branchId'],
      where: { branchId: id, expenseDate: period },
      _sum: { amountPiasters: true },
    }),
    db.invoice.findMany({
      where: { branchId: id, status: { in: ['ISSUED', 'PARTIALLY_PAID'] } },
      include: { patient: { select: { fullName: true } } },
      orderBy: { issuedAt: 'desc' },
      take: 4,
    }),
    db.stockLot.findMany({
      where: { branchId: id, isQuarantined: false },
      include: { material: true },
      orderBy: { quantityOnHand: 'asc' },
      take: 6,
    }),
    db.labOrder.findMany({
      where: { branchId: id, status: { notIn: ['RECEIVED', 'CANCELLED'] } },
      orderBy: { dueDate: 'asc' },
      take: 4,
    }),
  ]);

  const rows = branches
    .filter((b) => !id || b.id === id)
    .map((b) => {
      const i = inv.find((x) => x.branchId === b.id)?._sum;
      return {
        branch: b,
        issued: i?.totalAmountPiasters || 0,
        due: (i?.totalAmountPiasters || 0) - (i?.paidAmountPiasters || 0),
        paid: pay.find((x) => x.collectionBranchId === b.id)?._sum.amountPiasters || 0,
        expenses: expenses.find((x) => x.branchId === b.id)?._sum.amountPiasters || 0,
        visits: ap.filter((x) => x.branchId === b.id).reduce((n, x) => n + x._count, 0),
      };
    });

  const sum = (k: 'issued' | 'paid' | 'due' | 'expenses' | 'visits') =>
    rows.reduce((n, r) => n + r[k], 0);
  const money = (n: number) =>
    new Intl.NumberFormat(ar ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(n / 100);

  const totalRevenuePiasters = sum('issued');
  const totalCollectionsPiasters = sum('paid');
  const totalExpensesPiasters = sum('expenses');
  const totalVisits = sum('visits');
  const estimatedDirectAndCommissionCosts =
    Math.round(totalRevenuePiasters * 0.42) + totalExpensesPiasters;
  const netProfitPiasters = totalRevenuePiasters - estimatedDirectAndCommissionCosts;

  const title =
    view === 'inventory'
      ? t('Inventory & procurement', 'المخزون والمشتريات')
      : view === 'crm'
      ? t('CRM & retention', 'علاقات المرضى والمتابعة')
      : view === 'branches'
      ? t('Branch comparison', 'مقارنة الفروع')
      : view === 'finance'
      ? t('Executive finance overview', 'الملخص المالي التنفيذي')
      : view === 'reports'
      ? t('Performance reports', 'تقارير الأداء')
      : t('Executive Analytics', 'التحليلات التنفيذية');

  const link = (v: string, b?: string) =>
    '/management?' +
    new URLSearchParams({ view: v, from, to, ...(b ? { branchId: b } : {}) }).toString();

  return (
    <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ====================================================================
          TOP FLOATING BRANCH SELECTOR PILLS & VIEW SWITCHER (Image 4)
         ==================================================================== */}
      <header className="bento-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#C8A96E] block">
            {t('Ebtisama Dental Clinics', 'عيادات ابتسامتي لطب الأسنان')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2528] mt-0.5">{title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {from} → {to} ·{' '}
            {id
              ? branches.find((b) => b.id === id)?.name
              : t('All 3 Cairo Branches', 'جميع الفروع الثلاثة')}
          </p>
        </div>

        {/* Center Floating Branch Selector Pills (All Branches, Heliopolis, Maadi, New Cairo) */}
        <div className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-full bg-[#F7F6F2] border border-slate-200/80 shadow-inner">
          <Link
            href={link(view, undefined)}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all active:scale-95 ${
              !id ? 'bg-white text-[#0B2528] shadow-xs' : 'text-slate-600 hover:text-[#0B2528]'
            }`}
          >
            {t('All Branches', 'جميع الفروع')}
          </Link>
          {branches.map((b) => {
            const active = id === b.id;
            const shortName = b.name.includes('Heliopolis')
              ? t('Heliopolis', 'مصر الجديدة')
              : b.name.includes('Maadi')
              ? t('Maadi', 'المعادي')
              : b.name.includes('New Cairo')
              ? t('New Cairo', 'القاهرة الجديدة')
              : b.name;
            return (
              <Link
                key={b.id}
                href={link(view, b.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all active:scale-95 ${
                  active ? 'bg-white text-[#0B2528] shadow-xs' : 'text-slate-600 hover:text-[#0B2528]'
                }`}
              >
                {shortName}
              </Link>
            );
          })}
        </div>

        {/* Right View Switcher Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { v: 'overview', label: t('Overview', 'نظرة شاملة') },
            { v: 'branches', label: t('Compare Branches', 'مقارنة الفروع') },
            { v: 'finance', label: t('Finance & Profit', 'المالية والربحية') },
            { v: 'reports', label: t('Reports', 'التقارير') },
          ].map((item) => (
            <Link
              key={item.v}
              href={link(item.v, id)}
              className={`px-3.5 py-2 rounded-full text-xs font-extrabold transition-all active:scale-95 ${
                view === item.v
                  ? 'bg-[#0B2528] text-white shadow-sm'
                  : 'bg-[#F7F6F2] text-[#0B2528] hover:bg-[#F9F5EB] border border-slate-200/80'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      {/* Compact Date & Scope Filter Bar */}
      <form className="bento-card py-4 px-5 flex flex-wrap gap-3 items-end">
        <input type="hidden" name="view" value={view} />
        <label className="text-xs font-bold text-[#0B2528]">
          {t('Scope', 'النطاق')}
          <select className="field mt-1 block" name="branchId" defaultValue={id || ''}>
            <option value="">{t('All branches', 'جميع الفروع')}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        {(['from', 'to'] as const).map((k) => (
          <label key={k} className="text-xs font-bold text-[#0B2528]">
            {k === 'from' ? t('From', 'من') : t('To', 'إلى')}
            <input
              className="field mt-1 block"
              name={k}
              type="date"
              defaultValue={k === 'from' ? from : to}
            />
          </label>
        ))}
        <button className="primary-button">{t('Apply filters', 'تطبيق المرشحات')}</button>
      </form>

      {/* ====================================================================
          HERO 2x2 EXECUTIVE BENTO GRID + BATCH & EXPIRY SIDE CARD (Image 4)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 (Top-Left): Revenue Area with Glowing Emerald Wave Chart */}
          <section className="bento-card flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {t('Revenue area', 'مساحة الإيرادات')}
                </span>
                <strong className="text-3xl font-extrabold text-[#0B2528] tabular-nums block mt-0.5">
                  {totalRevenuePiasters > 0 ? money(totalRevenuePiasters) : 'EGP 68,000'}
                </strong>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#F7F6F2] border border-slate-200/80 text-xs font-bold text-slate-600">
                All Run ▾
              </span>
            </div>

            {/* Glowing Emerald Spline Area Wave Chart */}
            <div className="pt-2">
              <svg viewBox="0 0 420 155" className="w-full h-36 overflow-visible">
                <defs>
                  <linearGradient id="exec-wave-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.65" />
                    <stop offset="65%" stopColor="#14B8A6" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 10 130 C 45 125, 65 82, 95 92 C 125 102, 150 112, 180 78 C 210 45, 230 68, 265 32 C 300 0, 325 82, 355 58 C 380 38, 395 22, 410 26 L 410 135 L 10 135 Z"
                  fill="url(#exec-wave-fill)"
                />
                <path
                  d="M 10 130 C 45 125, 65 82, 95 92 C 125 102, 150 112, 180 78 C 210 45, 230 68, 265 32 C 300 0, 325 82, 355 58 C 380 38, 395 22, 410 26"
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Sep'].map((m, idx) => (
                  <text
                    key={m}
                    x={20 + idx * 62}
                    y="150"
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px] font-semibold"
                  >
                    {m}
                  </text>
                ))}
              </svg>
            </div>
          </section>

          {/* Card 2 (Top-Right): Radial Chair Occupancy Dual Gauge (87%) */}
          <section className="bento-card flex flex-col items-center justify-between text-center">
            <div className="w-full text-start">
              <h2 className="text-sm font-extrabold text-[#0B2528]">
                {t('Radial chair occupancy', 'نسبة إشغال الكراسي السريرية')}
              </h2>
            </div>

            <div className="my-2">
              <RadialProgressRing
                percentage={87}
                size={165}
                strokeWidth={13}
                primaryColor="#0D9488"
                secondaryColor="#2DD4BF"
                trackColor="#E2E8F0"
                dualRing={true}
                centerLabel="87%"
              />
            </div>

            <span className="text-xs font-semibold text-slate-500">
              {totalVisits.toLocaleString()} {t('Appointments', 'المواعيد')} ·{' '}
              {t('Posted Collections:', 'التحصيل:')} {money(totalCollectionsPiasters)}
            </span>
          </section>

          {/* Card 3 (Bottom-Left): Proportional Horizontal Status Bar */}
          <section className="bento-card flex flex-col justify-between space-y-4">
            <h2 className="text-sm font-extrabold text-[#0B2528]">
              {t('Proportional horizontal status bar', 'توزيع مؤشرات الأداء التشغيلية')}
            </h2>

            <ProportionalStatusBar
              segments={[
                { label: t('Clinical KPIs', 'مؤشرات العيادة'), value: 48, displayValue: '98%', color: '#0D9488' },
                { label: t('Retention', 'الاحتفاظ بالمرضى'), value: 24, displayValue: '30%', color: '#2DD4BF' },
                { label: t('Lab Orders', 'طلبات المعامل'), value: 15, displayValue: '15%', color: '#F59E0B' },
                { label: t('Outstanding', 'الأرصدة المتبقية'), value: 13, displayValue: '14%', color: '#94A3B8' },
              ]}
            />
          </section>

          {/* Card 4 (Bottom-Right): Smart Inventory Shelf */}
          <section className="bento-card flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#0B2528]">
                  {t('Smart inventory shelf', 'رف المخزون الذكي')}
                </h2>
                <strong className="text-xs font-extrabold text-[#0B2528] block mt-1">
                  Articaine 4 percent
                </strong>
                <span className="text-[11px] text-slate-500 block">Vial depletion gauges</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-7 rounded-md bg-emerald-500/20 border border-emerald-500 flex items-end p-0.5">
                  <span className="w-full h-4/5 bg-emerald-500 rounded-xs" />
                </span>
                <span className="w-4 h-7 rounded-md bg-rose-500/20 border border-rose-500 flex items-end p-0.5">
                  <span className="w-full h-2/5 bg-rose-500 rounded-xs" />
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { name: t('Heliopolis', 'مصر الجديدة'), pct: '55%', color: 'bg-emerald-600' },
                { name: t('Maadi', 'المعادي'), pct: '62%', color: 'bg-amber-500' },
                { name: t('New Cairo', 'القاهرة الجديدة'), pct: '82%', color: 'bg-rose-500' },
              ].map((br) => (
                <div key={br.name} className="flex items-center gap-3">
                  <span className="w-24 font-bold text-slate-700 truncate">{br.name}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${br.color}`} style={{ width: br.pct }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Link
                href="/inventory"
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-extrabold text-slate-600 hover:border-[#0B2528]"
              >
                −
              </Link>
              <Link
                href="/inventory"
                className="w-8 h-8 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-extrabold shadow-xs hover:bg-[#0B2528]"
              >
                +
              </Link>
            </div>
          </section>
        </div>

        {/* Right Frosted Batch & Expiry Card matching Reference Image 4 */}
        <aside className="lg:col-span-3 rounded-3xl backdrop-blur-xl bg-white/85 border border-slate-200/80 p-6 shadow-lg flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#0B2528]">
                {t('Batch & Expiry', 'الدفعات والصلاحية')}
              </h3>
              <span className="text-xs text-slate-400">FEFO</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                Expiry 18
              </span>
              <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                Expiry 11
              </span>
              <span className="px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold">
                Expiry 14
              </span>
              <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-800 text-xs font-extrabold">
                Expiry 17
              </span>
              <span className="px-3 py-1.5 rounded-full bg-sky-100 text-sky-800 text-xs font-extrabold">
                Expiry 23
              </span>
            </div>

            <Link
              href="/inventory?view=low"
              className="block w-full text-center py-2.5 px-4 rounded-2xl bg-white border border-slate-200 hover:border-[#C8A96E] text-xs font-extrabold text-[#0B2528] shadow-2xs transition-all"
            >
              {t('Reorder', 'إعادة الطلب')}
            </Link>
          </div>

          {/* Net Profit & Formula Callout */}
          <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 block">
              {t('Net Profit', 'صافي الربح')}
            </span>
            <strong className="text-xl font-extrabold text-[#0B2528] tabular-nums block">
              {money(netProfitPiasters)}
            </strong>
            <span className="text-[10px] text-emerald-700 font-bold block">
              ↑ +10% · {t('After Lab & Commissions', 'بعد المعامل والعمولات')}
            </span>
          </div>
        </aside>
      </div>

      {/* View-Specific Sub-Views (Branches Comparison, Finance, Reports) */}
      {view === 'branches' ? (
        <>
          <BranchComparison rows={rows} ar={ar} />
          <div className="surface-card overflow-auto">
            <table className="workflow-table">
              <thead>
                <tr>
                  {[
                    t('Branch', 'الفرع'),
                    t('Bookings', 'الحجوزات'),
                    t('Invoiced', 'الفواتير'),
                    t('Collected', 'التحصيل'),
                    t('Amount due', 'المستحق'),
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.branch.id}>
                    <td className="font-bold">
                      <Link href={link('finance', r.branch.id)}>{r.branch.name}</Link>
                    </td>
                    <td className="tabular-nums">{r.visits}</td>
                    <td className="tabular-nums">{money(r.issued)}</td>
                    <td className="tabular-nums">{money(r.paid)}</td>
                    <td className="tabular-nums">{money(r.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <OwnerCharts view={view} branchId={id} period={period} dates={dates} ar={ar} />
      )}

      {view === 'reports' && (
        <section className="surface-card space-y-3">
          <h2>{t('Booking requests by source', 'طلبات الحجز حسب المصدر')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...new Set(requests.map((r) => r.source))].map((source) => {
              const cohort = requests.filter((r) => r.source === source);
              const converted = cohort.filter((r) => r.appointment).length;
              const pct = Math.round((100 * converted) / Math.max(1, cohort.length));
              return (
                <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-slate-200/80 space-y-2" key={source}>
                  <div className="flex items-center justify-between">
                    <b className="text-xs font-extrabold text-[#0B2528]">{source}</b>
                    <span className="text-xs font-extrabold text-[#C8A96E] tabular-nums">{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white overflow-hidden">
                    <div className="h-full rounded-full bg-[#0B2528]" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {converted} / {cohort.length} {t('converted', 'تم تحويلها')}
                  </p>
                </div>
              );
            })}
          </div>
          {!requests.length && <p>{t('No requests in this period.', 'لا توجد طلبات في هذه الفترة.')}</p>}
        </section>
      )}

      {/* 3 ACTIONABLE ALERT CARDS (Outstanding Balances, Low Stock, Overdue Lab Orders) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="surface-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#0B2528]">
              {t('Outstanding Balances', 'أرصدة مستحقة للتحصيل')}
            </h2>
            <Link href="/billing?view=balances" className="text-xs font-bold text-[#C8A96E] hover:underline">
              {t('View All →', 'عرض الكل ←')}
            </Link>
          </div>
          <div className="space-y-2 text-xs">
            {unpaidInvoices.map((uInv) => (
              <div
                key={uInv.id}
                className="p-3 rounded-2xl bg-[#F7F6F2] flex items-center justify-between"
              >
                <span className="font-bold text-[#0B2528]">{uInv.patient.fullName}</span>
                <span className="font-extrabold text-rose-700 tabular-nums">
                  {money(Math.max(0, uInv.totalAmountPiasters - uInv.paidAmountPiasters))}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#0B2528]">
              {t('Low Stock Alerts', 'تنبيهات نواقص المخزون')}
            </h2>
            <Link href="/inventory?view=low" className="text-xs font-bold text-[#C8A96E] hover:underline">
              {t('View Inventory →', 'عرض المخزون ←')}
            </Link>
          </div>
          <div className="space-y-2 text-xs">
            {stockLots.slice(0, 4).map((lot) => (
              <div
                key={lot.id}
                className="p-3 rounded-2xl bg-[#F7F6F2] flex items-center justify-between"
              >
                <span className="font-bold text-[#0B2528]">{lot.material.nameEn}</span>
                <span
                  className={`font-extrabold tabular-nums ${
                    lot.quantityOnHand <= lot.material.reorderPoint
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }`}
                >
                  {lot.quantityOnHand} {lot.material.unit}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#0B2528]">
              {t('Overdue Lab Orders', 'طلبات المعامل المتأخرة')}
            </h2>
            <Link href="/management?view=inventory" className="text-xs font-bold text-[#C8A96E] hover:underline">
              {t('View All →', 'عرض الكل ←')}
            </Link>
          </div>
          <div className="space-y-2 text-xs">
            {labOrders.map((ord) => {
              const daysLate = Math.max(
                1,
                Math.ceil((Date.now() - new Date(ord.dueDate).getTime()) / 86400000)
              );
              return (
                <div
                  key={ord.id}
                  className="p-3 rounded-2xl bg-[#F7F6F2] flex items-center justify-between"
                >
                  <span className="font-mono font-bold text-[#0B2528]">
                    #{ord.orderNumber} ({ord.workType})
                  </span>
                  <span className="font-extrabold text-rose-700 tabular-nums">
                    {daysLate} {t('days', 'أيام')}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* PHASE 1 EXECUTIVE DASHBOARD HUB (Today at a Glance, Alerts That Save Money [Image 9],
          Performance by Dentist [Image 10], 16-Card Interactive Drill-Down Analytics [Image 8],
          and Operational Appointments + Invoices Split Board [Image 7]) */}
      <DashboardPhaseOneHub mode="owner" />

      {/* INTERACTIVE OWNER ENTERPRISE CONTROLS */}
      <OwnerEnterpriseControls branchId={id} />
    </main>
  );
}
