'use client';

import { PatientBooking } from '@/components/PatientBooking';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LocalizedTextarea, LocalizedInput } from '@/components/LocalizedControls';
import { TranslatedText } from '@/components/TranslatedText';
import { localizedText } from '@/lib/interface-messages';
import { useLanguage } from '@/context/LanguageContext';
import { localDate } from '@/lib/messages';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FrostedSlideOverDrawer } from '@/components/ui/FrostedSlideOverDrawer';
import { RadialProgressRing, LoyaltyArcGauge } from '@/components/ui/VisualSubPageCanvas';
import { resolveAuthenticatedIdentity } from '@/config/minya-clinic-store';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
  PlusCircle,
  ChevronRight,
  QrCode,
  Camera,
  MessageSquare,
  Sparkles,
  Crown,
  ShieldCheck,
} from 'lucide-react';

interface PatientDashboardProps {
  user: any;
  patient: any;
  nextAppointment: any;
  pendingRequests: any[];
  careTimeline: any[];
  treatmentPlans: any[];
  billingSummary: {
    totalInvoiced: number;
    totalPaid: number;
    totalBalanceDue: number;
    invoicesCount: number;
    paymentsCount: number;
  };
  installments: any[];
  estimatedTreatmentCostPiasters: number;
  latestSubmission: any;
  draftSubmission: any;
  notifications: any[];
  isAr: boolean;
}

export function PatientDashboardClient({
  user,
  patient,
  nextAppointment,
  pendingRequests: initialRequests,
  careTimeline,
  treatmentPlans,
  billingSummary,
  installments,
  estimatedTreatmentCostPiasters,
  latestSubmission,
}: PatientDashboardProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const router = useRouter();

  // Slide-Over Drawer states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(
    () => new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [rescheduleTimeWindow, setRescheduleTimeWindow] = useState('MORNING');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [extras, setExtras] = useState<any>({
    queuePosition: null,
    loyaltyPoints: 320,
    loyaltyHistory: [],
    prescriptions: [],
    qrToken: null,
  });
  const [approvingPlanId, setApprovingPlanId] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [booking, setBooking] = useState(false);

  // Interactive 3D Dental Arch & 3-Step Milestone Scrubber state
  const [selectedArchTooth, setSelectedArchTooth] = useState<string>('36');
  const [activeMilestoneStep, setActiveMilestoneStep] = useState<number>(2);

  useEffect(() => {
    if (!patient?.id) return;
    fetch(`/api/platform/operations?module=patient_extras&patientId=${patient.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setExtras(d);
      })
      .catch(() => {});
  }, [patient?.id]);

  async function handlePlanDecision(planId: string, decision: 'APPROVE' | 'REQUEST_CLARIFICATION') {
    setApprovingPlanId(planId);
    try {
      const res = await fetch('/api/portal/plan-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, action: decision }),
      });
      if (res.ok) {
        setActionSuccess(
          decision === 'APPROVE'
            ? isAr
              ? 'تمت الموافقة الرقمية على خطة العلاج بنجاح.'
              : 'Treatment plan digitally approved and recorded.'
            : isAr
            ? 'تم إرسال طلب التوضيح للطبيب المعالج.'
            : 'Clarification request sent to your dentist.'
        );
        router.refresh();
      }
    } catch {}
    setApprovingPlanId(null);
  }

  async function handleCancelAppointment() {
    if (!nextAppointment) return;
    setCancelLoading(true);
    setCancelError(null);

    try {
      const res = await fetch('/api/scheduling/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL',
          appointmentId: nextAppointment.id,
          reason: cancelReason || 'Patient requested cancellation through portal',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel appointment');
      }

      setShowCancelModal(false);
      setActionSuccess('Appointment successfully cancelled. Obsolete reminders have been deactivated.');
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setCancelError(err.message || 'Cancellation failed');
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleRescheduleAppointment() {
    if (!nextAppointment) return;
    setRescheduleLoading(true);
    setRescheduleError(null);

    try {
      const res = await fetch('/api/scheduling/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESCHEDULE',
          appointmentId: nextAppointment.id,
          newDate: rescheduleDate,
          newTimeWindow: rescheduleTimeWindow,
          reason: rescheduleReason || 'Patient requested new slot',
          serviceDescription: nextAppointment.serviceDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reschedule appointment');
      }

      setShowRescheduleModal(false);
      setActionSuccess(
        'Reschedule request sent to reception desk. You will receive a confirmation notice shortly.'
      );
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setRescheduleError(err.message || 'Rescheduling failed');
    } finally {
      setRescheduleLoading(false);
    }
  }

  const c = (en: string, ar: string) => (isAr ? ar : en);
  const amount = (p: number) =>
    new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(p / 100);

  const resolvedPatientIdentity = resolveAuthenticatedIdentity(
    {
      id: user?.id,
      fullName: patient?.fullName || user?.fullName,
      email: user?.email,
    },
    'patient'
  );
  const displayFirstName =
    resolvedPatientIdentity.firstName === 'Passant'
      ? c('Passant', 'بسنت')
      : resolvedPatientIdentity.firstName;
  const displayAvatarInitials = resolvedPatientIdentity.initials;

  const other = careTimeline.filter((a) => a.id !== nextAppointment?.id);
  const intakeNeeded = !latestSubmission || latestSubmission.status === 'DRAFT';
  const offered = initialRequests.some((r) => r.status === 'ALTERNATIVE_PROPOSED');

  // Financial Progress Ring calculation
  const paidRatioPct =
    billingSummary.totalInvoiced > 0
      ? Math.round((billingSummary.totalPaid / billingSummary.totalInvoiced) * 100)
      : 50;
  const nextInstallmentPiasters = installments[0]?.amountPiasters || 500000;

  const milestones = [
    {
      step: 1,
      titleEn: 'Root Canal',
      titleAr: 'علاج الجذور',
      status: 'COMPLETED',
      tooth: '#36',
      descEn: 'Endodontic canal obturation completed & verified.',
      descAr: 'تم إتمام علاج العصب وحشو القنوات بنجاح.',
    },
    {
      step: 2,
      titleEn: 'Post & Core',
      titleAr: 'دعامة وبناء السن',
      status: 'ACTIVE',
      tooth: '#36',
      descEn: 'Fiber post placement & core build-up in progress.',
      descAr: 'تركيب الدعامة وبناء قلب السن للتحضير للتاج.',
    },
    {
      step: 3,
      titleEn: 'Ceramic Crown',
      titleAr: 'تاج زيركون سيراميك',
      status: 'UPCOMING',
      tooth: '#36',
      descEn: 'Digital scan & monolithic Zirconia crown cementation.',
      descAr: 'المسح الرقمي وتثبيت تاج الزيركون النهائي.',
    },
  ];

  return (
    <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ====================================================================
          TOP HOSPITALITY HEADER BAR (Matching Reference Mockup 1)
         ==================================================================== */}
      <header className="bento-card flex flex-wrap items-center justify-between gap-4 py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C8A96E] to-[#0B2528] text-white font-extrabold text-base flex items-center justify-center shadow-sm ring-2 ring-[#C8A96E]/40">
            {displayAvatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <small className="font-mono text-xs font-bold text-slate-400">
                {patient?.patientNumber}
              </small>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              <span className="text-[#C8A96E]">{c('Welcome', 'مرحباً بعودتك،')}</span>{' '}
              <span className="text-[#0B2528]">{displayFirstName}</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Patient QR Pass Pill Button */}
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#F7F6F2] hover:bg-[#F9F5EB] border border-[#C8A96E]/50 text-xs font-extrabold text-[#0B2528] transition-all hover:-translate-y-0.5 active:scale-95 shadow-2xs"
          >
            <span>{c('Patient QR Pass', 'بطاقة QR للمريض')}</span>
            <QrCode className="w-4 h-4 text-[#0B2528]" />
          </button>

          {patient && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setBooking(true)}
            >
              <PlusCircle size={16} className="text-[#C8A96E]" />
              <span>{c('Book New Appointment', 'احجز موعداً جديداً')}</span>
            </button>
          )}
        </div>
      </header>

      {actionSuccess && (
        <p
          role="status"
          className="rounded-2xl p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </p>
      )}

      {/* ====================================================================
          HERO BENTO GRID (Financial Progress Ring, Loyalty Arc Gauge,
          Interactive 3D Dental Arch + 3-Step Milestone Scrubber, Action Tiles)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: Financial Progress Ring + Loyalty Arc Gauge */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card 1: Unified Financial Progress Ring */}
          <section className="bento-card flex flex-col items-center justify-between text-center flex-1">
            <div className="w-full flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-[#0B2528]">
                {c('Financial Progress Ring', 'مؤشر السداد المالي')}
              </h2>
              <Link
                href="/portal/billing"
                className="text-xs font-bold text-[#C8A96E] hover:text-[#0B2528] transition-colors"
              >
                {c('Details →', 'التفاصيل ←')}
              </Link>
            </div>

            <div className="my-2">
              <RadialProgressRing
                percentage={paidRatioPct}
                size={168}
                strokeWidth={14}
                primaryColor="#0B2528"
                secondaryColor="#C8A96E"
                centerLabel={`${paidRatioPct}%`}
                centerSublabel={c('Paid', 'مدفوع')}
                centerCaption={
                  billingSummary.totalInvoiced > 0
                    ? `(${amount(billingSummary.totalPaid)} / ${amount(billingSummary.totalInvoiced)})`
                    : '(EGP 15,000 of 30,000)'
                }
              />
            </div>

            <div className="w-full pt-3 flex items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7F6F2] border border-slate-200/80 text-xs font-semibold text-slate-600">
                <span>{c('Next Installment', 'القسط القادم')}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#0B2528] text-white font-extrabold tabular-nums">
                  {amount(nextInstallmentPiasters)}
                </span>
              </div>
            </div>
          </section>

          {/* Card 2: Loyalty Arc Gauge */}
          <section className="bento-card flex flex-col items-center justify-between text-center flex-1">
            <div className="w-full flex items-center justify-between mb-1">
              <h2 className="text-base font-extrabold text-[#0B2528]">
                {c('Loyalty Arc Gauge', 'مؤشر نقاط الولاء')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F9F5EB] text-[#85652B] text-[11px] font-extrabold border border-[#C8A96E]/40">
                ★ VIP Care
              </span>
            </div>

            <LoyaltyArcGauge
              points={extras.loyaltyPoints || 320}
              maxPoints={500}
              label="pts"
              subtitle={c('Gauge', 'مؤشر النقاط')}
              footerLabel={c('Activity Rings', 'حلقات النشاط')}
            />
          </section>
        </div>

        {/* RIGHT WIDE COLUMN: Treatment Journey (3D Dental Arch + 3-Step Scrubber) + Bottom Action Tiles */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Centerpiece Card: Treatment Journey */}
          <section className="bento-card flex-1 flex flex-col justify-between space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#0B2528]">
                  {c('Treatment Journey', 'رحلة علاجي التفاعلية')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {c(
                    'Interactive 3D Dental Arch & Milestone Scrubber — select a tooth or milestone step',
                    'مخطط القوس السني ثلاثي الأبعاد ومراحل العلاج — اضغط على السن أو المرحلة'
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {['36', '14', '21', '46'].map((tNum) => (
                  <button
                    key={tNum}
                    type="button"
                    onClick={() => setSelectedArchTooth(tNum)}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold font-mono transition-all active:scale-95 ${
                      selectedArchTooth === tNum
                        ? 'bg-[#0B2528] text-[#C8A96E] shadow-xs'
                        : 'bg-[#F7F6F2] text-slate-600 hover:bg-[#F9F5EB]'
                    }`}
                  >
                    #{tNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive 3D-Styled SVG Dental Arch + Connected 3-Step Milestone Scrubber */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
              {/* Left: 3D Mandibular Dental Arch SVG with Glowing Active Tooth #36 */}
              <div className="md:col-span-5 flex flex-col items-center justify-center relative">
                <svg
                  viewBox="0 0 320 220"
                  className="w-full max-w-[290px] drop-shadow-[0_14px_24px_rgba(11,37,40,0.08)]"
                  role="img"
                  aria-label="Interactive 3D Dental Arch"
                >
                  <defs>
                    <radialGradient id="tooth-glow-36" cx="50%" cy="50%" r="55%">
                      <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.55" />
                      <stop offset="55%" stopColor="#C8A96E" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="arch-gum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ECEAE4" />
                      <stop offset="100%" stopColor="#D8D5CD" />
                    </linearGradient>
                    <linearGradient id="enamel-white" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="#E6E4DD" />
                    </linearGradient>
                  </defs>

                  {/* 3D Mandibular Base / Alveolar Ridge */}
                  <path
                    d="M 42 52 C 30 135, 85 196, 160 196 C 235 196, 290 135, 278 52 C 266 36, 245 42, 238 62 C 225 118, 198 148, 160 148 C 122 148, 95 118, 82 62 C 75 42, 54 36, 42 52 Z"
                    fill="url(#arch-gum)"
                    stroke="#E2DFD7"
                    strokeWidth="2"
                  />

                  {/* Glowing Aura under Active Tooth #36 */}
                  <circle cx="122" cy="148" r="38" fill="url(#tooth-glow-36)" />

                  {/* Posterior Left Molars */}
                  {[
                    { id: '48', cx: 56, cy: 62, r: 14 },
                    { id: '47', cx: 63, cy: 88, r: 15 },
                    { id: '46', cx: 76, cy: 114, r: 16 },
                    { id: '45', cx: 96, cy: 135, r: 13 },
                    { id: '36', cx: 122, cy: 148, r: 17, active: true },
                    { id: '31', cx: 152, cy: 155, r: 12 },
                    { id: '32', cx: 178, cy: 153, r: 12 },
                    { id: '34', cx: 204, cy: 142, r: 13 },
                    { id: '35', cx: 226, cy: 124, r: 15 },
                    { id: '37', cx: 244, cy: 98, r: 15 },
                    { id: '38', cx: 254, cy: 70, r: 14 },
                  ].map((t) => {
                    const isPicked = selectedArchTooth === t.id;
                    return (
                      <g
                        key={t.id}
                        onClick={() => setSelectedArchTooth(t.id)}
                        className="cursor-pointer transition-transform hover:scale-105"
                      >
                        <rect
                          x={t.cx - t.r}
                          y={t.cy - t.r}
                          width={t.r * 2}
                          height={t.r * 2.1}
                          rx={t.r * 0.65}
                          fill={isPicked ? '#0B2528' : 'url(#enamel-white)'}
                          stroke={isPicked ? '#C8A96E' : '#CBD5E1'}
                          strokeWidth={isPicked ? '3' : '1.2'}
                        />
                        {/* Occlusal anatomy grooves */}
                        <path
                          d={`M ${t.cx - t.r * 0.45} ${t.cy} L ${t.cx + t.r * 0.45} ${t.cy} M ${t.cx} ${
                            t.cy - t.r * 0.45
                          } L ${t.cx} ${t.cy + t.r * 0.45}`}
                          stroke={isPicked ? '#C8A96E' : '#94A3B8'}
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  })}

                  {/* Callout Label #36 */}
                  <text
                    x="122"
                    y="188"
                    textAnchor="middle"
                    className="fill-[#0B2528] font-mono text-xs font-extrabold"
                  >
                    #{selectedArchTooth}
                  </text>
                  {/* Connector line from Tooth #36 to Step 1 */}
                  <polyline
                    points="132,132 162,102 315,102"
                    fill="none"
                    stroke="#0B2528"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle cx="132" cy="132" r="3.5" fill="#0B2528" />
                </svg>
              </div>

              {/* Right: Clickable 3-Step Milestone Scrubber */}
              <div className="md:col-span-7 space-y-4">
                <div className="relative flex items-center justify-between px-2">
                  {/* Connecting horizontal line behind steps */}
                  <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />

                  {milestones.map((m) => {
                    const isSelected = activeMilestoneStep === m.step;
                    const isCompleted = m.status === 'COMPLETED';
                    const isActive = m.status === 'ACTIVE';
                    return (
                      <button
                        key={m.step}
                        type="button"
                        onClick={() => setActiveMilestoneStep(m.step)}
                        className="relative z-10 flex flex-col items-center gap-2 group focus:outline-none"
                      >
                        <span className="text-[11px] font-bold text-slate-500">
                          {c(`Step ${m.step}`, `مرحلة ${m.step}`)}
                        </span>

                        <div
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isActive || isSelected
                              ? 'bg-[#F9F5EB] ring-4 ring-[#0B2528] shadow-[0_0_25px_rgba(20,184,166,0.35)] scale-105'
                              : isCompleted
                              ? 'bg-[#F9F5EB] border-2 border-[#C8A96E] shadow-sm'
                              : 'bg-white border-2 border-slate-200 hover:border-[#C8A96E]'
                          }`}
                        >
                          {m.step === 1 && (
                            <div className="relative">
                              <Sparkles className="w-7 h-7 text-[#C8A96E]" />
                              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#0B2528] text-white text-[9px] flex items-center justify-center font-bold">
                                ✓
                              </span>
                            </div>
                          )}
                          {m.step === 2 && (
                            <div className="w-9 h-9 rounded-full bg-[#0B2528] text-[#C8A96E] flex items-center justify-center font-black text-sm">
                              ⛨
                            </div>
                          )}
                          {m.step === 3 && <Crown className="w-7 h-7 text-[#C8A96E]" />}
                        </div>

                        <div className="text-center">
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            {c(`Step ${m.step}`, `المرحلة ${m.step}`)}
                          </span>
                          <strong className="text-xs sm:text-sm font-extrabold text-[#0B2528] block">
                            {isAr ? m.titleAr : m.titleEn}
                          </strong>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Milestone Detail & Plan Approval Strip */}
                <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0B2528] text-[#C8A96E] text-[10px] font-extrabold font-mono">
                        Tooth #{selectedArchTooth}
                      </span>
                      <strong className="text-xs font-extrabold text-[#0B2528]">
                        {isAr
                          ? milestones[activeMilestoneStep - 1].titleAr
                          : milestones[activeMilestoneStep - 1].titleEn}
                      </strong>
                    </div>
                    <p className="text-xs text-slate-600">
                      {isAr
                        ? milestones[activeMilestoneStep - 1].descAr
                        : milestones[activeMilestoneStep - 1].descEn}
                    </p>
                  </div>

                  {treatmentPlans[0]?.status === 'PROPOSED' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={approvingPlanId === treatmentPlans[0].id}
                        onClick={() => handlePlanDecision(treatmentPlans[0].id, 'APPROVE')}
                        className="primary-button text-xs py-1.5 px-3.5"
                      >
                        {c('Approve Plan', 'الموافقة على الخطة')}
                      </button>
                      <button
                        type="button"
                        disabled={approvingPlanId === treatmentPlans[0].id}
                        onClick={() => handlePlanDecision(treatmentPlans[0].id, 'REQUEST_CLARIFICATION')}
                        className="secondary-button text-xs py-1.5 px-3"
                      >
                        {c('Request Clarification', 'طلب توضيح')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* BOTTOM 3 ACTION TILES: Live Queue Radar + Upload X-Rays + Clinic Messages */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Tile 1: Pulsing Live Queue Radar Pill (View-Only, strictly no self-check-in) */}
            <div className="sm:col-span-6 bento-card p-3.5 flex items-center justify-between gap-3 bg-gradient-to-r from-[#E6F0EE] to-white border-[#0B2528]/15">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-12 h-12 rounded-full bg-[#0B2528]/15 flex items-center justify-center shrink-0">
                  <span className="absolute inset-0 rounded-full bg-[#0B2528]/20 animate-radar" />
                  <span className="w-7 h-7 rounded-full bg-[#0B2528]/35 flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-[#0B2528]" />
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-[#0B2528] truncate">
                    {c('Live Queue Radar', 'رادار الانتظار المباشر')}
                  </h3>
                  <p className="text-xs text-slate-600 truncate">
                    {extras.queuePosition
                      ? `#${extras.queuePosition.positionInLine} · ~${extras.queuePosition.estimatedWaitMinutes} min wait`
                      : c(
                          'Checked in at reception desk upon arrival',
                          'يُفعّل فور تسجيل الوصول بالاستقبال'
                        )}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white text-[#0B2528] font-extrabold text-xs tabular-nums shadow-2xs shrink-0">
                {extras.queuePosition ? `#${extras.queuePosition.positionInLine}` : 'LIVE'}
              </span>
            </div>

            {/* Tile 2: Upload X-Rays */}
            <Link
              href="/portal/records"
              className="sm:col-span-3 bento-card p-4 flex flex-col justify-between group hover:border-[#C8A96E]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#F9F5EB] text-[#C8A96E] flex items-center justify-center border border-[#C8A96E]/30">
                  <Camera className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B2528] transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
              </div>
              <div className="mt-3">
                <strong className="text-sm font-extrabold text-[#0B2528] block">
                  {c('Upload X-Rays', 'رفع الأشعة والملفات')}
                </strong>
                <span className="text-[11px] text-slate-500">
                  {c('Chart & scans', 'المخطط والأشعة')}
                </span>
              </div>
            </Link>

            {/* Tile 3: Clinic Messages */}
            <Link
              href="/portal/feedback"
              className="sm:col-span-3 bento-card p-4 flex flex-col justify-between group hover:border-[#C8A96E]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#F9F5EB] text-[#C8A96E] flex items-center justify-center border border-[#C8A96E]/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B2528] transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
              </div>
              <div className="mt-3">
                <strong className="text-sm font-extrabold text-[#0B2528] block">
                  {c('Clinic Messages', 'رسائل العيادة')}
                </strong>
                <span className="text-[11px] text-slate-500">
                  {c('Direct support', 'تواصل مباشر')}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SECONDARY BENTO ROW: Next Confirmed Appointment & Action Checklist
         ==================================================================== */}
      <div className="grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 rounded-3xl bg-[#0B2528] p-6 text-white shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#C8A96E]">
                {c('My Next Appointment', 'موعدي القادم')}
              </span>
              {nextAppointment && <StatusBadge status={nextAppointment.status} />}
            </div>

            {nextAppointment ? (
              <div className="mt-4 space-y-2">
                <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                  {localDate(nextAppointment.appointmentDate, locale)}
                </p>
                <p className="text-sm text-slate-300">
                  <bdi>
                    {nextAppointment.startTime} – {nextAppointment.endTime}
                  </bdi>{' '}
                  · {nextAppointment.durationMinutes} {c('minutes', 'دقيقة')}
                </p>
                <p className="text-sm font-bold text-[#C8A96E] pt-1">
                  {nextAppointment.dentistUser?.fullName} ·{' '}
                  <TranslatedText text={nextAppointment.branch?.name || ''} />
                </p>
                <p className="text-xs text-slate-300">
                  <TranslatedText text={nextAppointment.serviceDescription} />
                </p>

                <div className="pt-4 mt-4 border-t border-white/15 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all active:scale-95"
                    onClick={() => setShowRescheduleModal(true)}
                  >
                    {c('Request rescheduling', 'طلب تغيير الموعد')}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold border border-rose-400/30 transition-all active:scale-95"
                    onClick={() => setShowCancelModal(true)}
                  >
                    {c('Cancel appointment', 'إلغاء الموعد')}
                  </button>
                </div>
              </div>
            ) : (
              <p className="py-6 text-sm text-slate-300">
                {c('No confirmed appointment yet.', 'لا يوجد موعد مؤكد بعد.')}
              </p>
            )}
          </div>

          {other.length > 0 && (
            <div className="border-t border-white/15 pt-3 mt-4 space-y-1.5 text-xs text-slate-300">
              {other.map((a) => (
                <p key={a.id}>
                  {localDate(a.appointmentDate, locale)} · {a.startTime} · {a.dentistUser?.fullName}
                </p>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 bento-card flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#0B2528]">
              {c('Things You Need to Do', 'مهامك القادمة')}
            </h2>
            <div className="mt-3 space-y-2.5">
              {intakeNeeded && (
                <Link
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F6F2] hover:bg-[#F9F5EB] border border-slate-200/80 text-xs font-extrabold text-[#0B2528] transition-all"
                  href="/portal/intake"
                >
                  <span>{c('Complete your medical intake', 'أكمل الاستبيان الطبي')}</span>
                  <ChevronRight className="w-4 h-4 text-[#C8A96E] rtl:rotate-180" />
                </Link>
              )}
              {offered && (
                <Link
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-extrabold text-amber-900 transition-all"
                  href="/portal/appointments"
                >
                  <span>
                    {c('Review a proposed appointment time', 'راجع الموعد البديل المقترح')}
                  </span>
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              )}
              {billingSummary.totalBalanceDue > 0 && (
                <Link
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F6F2] hover:bg-[#F9F5EB] border border-slate-200/80 text-xs font-bold text-[#0B2528] transition-all"
                  href="/portal/billing"
                >
                  <span>{c('View invoice & installment plan', 'عرض الفاتورة والأقساط')}</span>
                  <strong className="font-extrabold text-[#0B2528] tabular-nums">
                    {amount(billingSummary.totalBalanceDue)}
                  </strong>
                </Link>
              )}
              {!intakeNeeded && !offered && !billingSummary.totalBalanceDue && (
                <p className="py-4 text-xs text-slate-500">
                  {c("You're all caught up!", 'لا توجد مهام معلقة.')}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link href="/portal/records" className="font-extrabold text-[#0B2528] hover:text-[#C8A96E] inline-flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#C8A96E]" />
              <span>{c('My Records & Care', 'سجلاتي ورعايتي')}</span>
            </Link>
            {estimatedTreatmentCostPiasters > 0 && (
              <span className="text-slate-500 tabular-nums">
                {c('Future care:', 'تقدير مستقبلي:')} {amount(estimatedTreatmentCostPiasters)}
              </span>
            )}
          </div>
        </section>
      </div>

      {/* ====================================================================
          SLIDE-OVER DRAWERS (Book Appointment, QR Pass, Cancel, Reschedule)
         ==================================================================== */}
      {booking && patient && (
        <PatientBooking
          patientId={patient.id}
          onClose={() => setBooking(false)}
          onSaved={() => {
            setBooking(false);
            setActionSuccess(c('Request sent to reception.', 'تم إرسال الطلب إلى الاستقبال.'));
            router.refresh();
          }}
        />
      )}

      {/* Patient QR Pass Drawer */}
      <FrostedSlideOverDrawer
        open={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={c('Patient QR Pass', 'بطاقة QR للمريض')}
        subtitle={c('Present at front-desk reception on arrival', 'أبرز الرمز لموظف الاستقبال عند الوصول')}
        iconBadge={<QrCode className="w-5 h-5" />}
      >
        <div className="p-6 rounded-3xl bg-[#0B2528] text-white text-center space-y-4">
          <div className="w-40 h-40 mx-auto rounded-2xl bg-white p-4 flex items-center justify-center shadow-inner">
            <QrCode className="w-28 h-28 text-[#0B2528]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">{patient?.fullName || user.fullName}</h3>
            <p className="text-xs font-mono text-[#C8A96E] mt-0.5">{patient?.patientNumber}</p>
          </div>
          {extras.qrToken && (
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-xs space-y-1">
              <span className="block text-slate-300">
                {c('Revocable Portal Access Token', 'رمز دخول مؤقت قابل للإلغاء')}
              </span>
              <strong className="font-mono text-[#C8A96E] block">{extras.qrToken.token}</strong>
            </div>
          )}
        </div>
      </FrostedSlideOverDrawer>

      {/* Cancel Appointment Drawer */}
      <FrostedSlideOverDrawer
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={localizedText(isAr ? 'ar' : 'en', 'text_1377fffacc')}
        subtitle={localizedText(isAr ? 'ar' : 'en', 'text_0b69f6928d')}
        iconBadge={<AlertTriangle className="w-5 h-5" />}
        footer={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCancelModal(false)}
              className="secondary-button flex-1"
            >
              {localizedText(isAr ? 'ar' : 'en', 'text_6cc73543e4')}
            </button>
            <button
              onClick={handleCancelAppointment}
              disabled={cancelLoading}
              className="primary-button flex-1 !bg-rose-600 !border-rose-600"
            >
              {cancelLoading
                ? localizedText(isAr ? 'ar' : 'en', 'text_b74e42efb4')
                : localizedText(isAr ? 'ar' : 'en', 'text_64112c744f')}
            </button>
          </div>
        }
      >
        {cancelError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold">
            {cancelError}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-[#0B2528] mb-1.5">
            {localizedText(isAr ? 'ar' : 'en', 'text_d9ad75f404')}
          </label>
          <LocalizedTextarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={localizedText(isAr ? 'ar' : 'en', 'text_f0cc60de10')}
            className="field w-full"
            rows={3}
          />
        </div>
      </FrostedSlideOverDrawer>

      {/* Reschedule Appointment Drawer */}
      <FrostedSlideOverDrawer
        open={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title={localizedText(isAr ? 'ar' : 'en', 'text_85c5f8e42c')}
        subtitle={localizedText(isAr ? 'ar' : 'en', 'text_1fca02e873')}
        iconBadge={<Clock className="w-5 h-5" />}
        footer={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRescheduleModal(false)}
              className="secondary-button flex-1"
            >
              {localizedText(isAr ? 'ar' : 'en', 'text_bda298ca90')}
            </button>
            <button
              onClick={handleRescheduleAppointment}
              disabled={rescheduleLoading}
              className="primary-button flex-1"
            >
              {rescheduleLoading
                ? localizedText(isAr ? 'ar' : 'en', 'text_3cc2e71fb4')
                : localizedText(isAr ? 'ar' : 'en', 'text_49ff974f6d')}
            </button>
          </div>
        }
      >
        {rescheduleError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold">
            {rescheduleError}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0B2528] mb-1.5">
              {localizedText(isAr ? 'ar' : 'en', 'text_5c8ad6373e')}
            </label>
            <input
              type="date"
              value={rescheduleDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="field w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B2528] mb-1.5">
              {localizedText(isAr ? 'ar' : 'en', 'text_a88c488b21')}
            </label>
            <select
              value={rescheduleTimeWindow}
              onChange={(e) => setRescheduleTimeWindow(e.target.value)}
              className="field w-full"
            >
              <option value="MORNING">{localizedText(isAr ? 'ar' : 'en', 'text_db78d62785')}</option>
              <option value="AFTERNOON">{localizedText(isAr ? 'ar' : 'en', 'text_428053bc22')}</option>
              <option value="EVENING">{localizedText(isAr ? 'ar' : 'en', 'text_c96fa1f6fa')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B2528] mb-1.5">
              {localizedText(isAr ? 'ar' : 'en', 'text_55ee5ed4eb')}
            </label>
            <LocalizedInput
              type="text"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder={localizedText(isAr ? 'ar' : 'en', 'text_2409b2c38e')}
              className="field w-full"
            />
          </div>
        </div>
      </FrostedSlideOverDrawer>
    </main>
  );
}

export default PatientDashboardClient;
