'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDate, formatDateTime } from '@/lib/utils';
import { StatusTag } from '@/components/ui/StatusTag';
import { PriorityIndicator } from '@/components/ui/PriorityIndicator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Receipt, 
  FileText, 
  Bell, 
  ShieldAlert, 
  PlusCircle, 
  X, 
  AlertCircle,
  Stethoscope,
  ChevronRight,
  TrendingUp,
  CreditCard,
  HeartPulse,
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
  draftSubmission,
  notifications,
  isAr,
}: PatientDashboardProps) {
  const router = useRouter();

  // Modals state
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

  const [arrivedLoading, setArrivedLoading] = useState(false);
  const [arrivedSuccess, setArrivedSuccess] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Cancellation handler enforcing 24h policy
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

  // Reschedule handler
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
      setActionSuccess('Reschedule request sent to reception desk. You will receive a confirmation notice shortly.');
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setRescheduleError(err.message || 'Rescheduling failed');
    } finally {
      setRescheduleLoading(false);
    }
  }

  // Self arrival check-in handler
  async function handleReportArrival() {
    if (!nextAppointment) return;
    setArrivedLoading(true);
    try {
      const res = await fetch('/api/scheduling/arrivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: nextAppointment.branchId,
          appointmentId: nextAppointment.id,
        }),
      });

      if (res.ok) {
        setArrivedSuccess(true);
        setActionSuccess("Arrival recorded. Please take a seat; reception will verify your presence and call you into the operatory.");
      } else {
        const d = await res.json();
        alert(d.error || 'Could not report arrival.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setArrivedLoading(false);
    }
  }

  return (
    <div className="eb-patient-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-950 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. MODERN PATIENT WELCOME & QUICK PATHWAYS (Matching Reference Theme) */}
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#0F827B] text-xs font-bold border border-[#D4F3E2]">
              <span className="w-2 h-2 rounded-full bg-[#0F827B] animate-pulse" />
              <span>{isAr ? 'بوابة رعاية ابتسامتك الشخصية' : 'PERSONAL DENTAL HEALTH PORTAL'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {isAr ? `أهلاً بك، ${user.fullName.split(' ')[0]}` : `Welcome back, ${user.fullName.split(' ')[0]}!`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              {isAr 
                ? 'مواعيدك وخطة علاجك وفواتيرك الطبية في مساحة رقمية منظمة وآمنة.'
                : 'Keep your next consultation, clinical milestones, medical history, and payments beautifully organized in one place.'}
            </p>
            {patient && (
              <div className="pt-1">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                  {isAr ? 'رقم ملف المريض: ' : 'Patient File ID: '}{patient.patientNumber}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/portal/appointments"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F827B] hover:bg-[#0c6b65] text-white text-xs font-bold shadow-xs transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>{isAr ? 'مواعيدي القادمة' : 'My Appointments'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/portal/intake"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <HeartPulse className="w-4 h-4 text-[#0F827B]" />
              <span>{isAr ? 'الاستبيان الصحي' : 'Medical Intake'}</span>
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <PlusCircle className="w-4 h-4 text-[#0F827B]" />
              <span>{isAr ? 'حجز موعد جديد' : 'Book New'}</span>
            </Link>
          </div>
        </div>

        {/* Quick Pathway Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-slate-100">
          <Link
            href="/portal/appointments"
            className="p-4 rounded-2xl bg-slate-50/70 hover:bg-[#EBF9F1]/50 border border-slate-100 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-bold text-slate-900 block">{isAr ? 'المواعيد' : 'Appointments'}</strong>
                <span className="text-[11px] text-slate-400">{isAr ? 'المواعيد والتعديل' : 'Upcoming visits & changes'}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0F827B] transition-colors" />
          </Link>

          <Link
            href="/portal/billing"
            className="p-4 rounded-2xl bg-slate-50/70 hover:bg-[#EBF9F1]/50 border border-slate-100 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-bold text-slate-900 block">{isAr ? 'الفواتير والمدفوعات' : 'Payments & Invoices'}</strong>
                <span className="text-[11px] text-slate-400">{isAr ? 'إيصالات السداد والأقساط' : 'Receipts & installments'}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0F827B] transition-colors" />
          </Link>

          <Link
            href="/portal/intake"
            className="p-4 rounded-2xl bg-slate-50/70 hover:bg-[#EBF9F1]/50 border border-slate-100 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-bold text-slate-900 block">{isAr ? 'خطتي الصحية' : 'My Care Plan'}</strong>
                <span className="text-[11px] text-slate-400">{isAr ? 'الاستبيان والتاريخ الطبي' : 'Intake & clinical steps'}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0F827B] transition-colors" />
          </Link>
        </div>
      </div>

            {/* First Fold: Dominant Next Confirmed Appointment & My Next Actions Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dominant Next Confirmed Appointment (7 / 12 columns) */}
        <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-eb-line mb-5">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-eb-blue/10 text-eb-blue">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-serif font-bold text-eb-ink">
                    {isAr ? 'الموعد القادم المؤكد' : 'Next Confirmed Appointment'}
                  </h2>
                  <span className="text-[11px] text-eb-muted">
                    {isAr ? 'حجز رسمي مؤكد بالعيادة' : 'Officially scheduled consultation'}
                  </span>
                </div>
              </div>
              {nextAppointment ? (
                <StatusTag variant="verified" label={nextAppointment.status} size="sm" />
              ) : (
                <StatusTag variant="neutral" label={isAr ? 'لا يوجد موعد مؤكد' : 'No Booking'} size="sm" />
              )}
            </div>

            {nextAppointment ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#F7F8F5] border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    {/* Functional Visual Calendar Date Tile */}
                    <div className="w-16 h-16 rounded-2xl bg-[#1F6FB2] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-100">
                        {new Date(nextAppointment.appointmentDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-extrabold leading-none mt-0.5">
                        {new Date(nextAppointment.appointmentDate).getDate()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-[#1F6FB2] block uppercase tracking-wider font-mono">
                        {nextAppointment.serviceDescription}
                      </span>
                      <h3 className="text-lg font-bold text-[#163447] mt-0.5">
                        {new Date(nextAppointment.appointmentDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[#1F6FB2]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{nextAppointment.startTime} – {nextAppointment.endTime}</span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#F59B20]" />
                          <span>{nextAppointment.branch?.name}</span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-[#18794E]" />
                          <span>{nextAppointment.dentistUser?.fullName}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action: I've Arrived (Check In) */}
                  <div className="shrink-0 flex flex-col sm:items-end gap-1">
                    {nextAppointment.arrivalEvent?.isVerified ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#18794E] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#18794E]" />
                        <span>{isAr ? 'تم التحقق بالعيادة ✓' : 'Verified in Queue ✓'}</span>
                      </span>
                    ) : arrivedSuccess || nextAppointment.arrivalEvent ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-[#946200] flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#946200]" />
                        <span>{isAr ? 'بانتظار الاستقبال...' : 'Awaiting Reception...'}</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleReportArrival}
                        disabled={arrivedLoading}
                        className="eb-semantic-action eb-semantic-action--primary"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>{arrivedLoading ? (isAr ? 'جاري التسجيل...' : 'Recording...') : (isAr ? 'وصلت العيادة (تسجيل)' : "I've Arrived (Check In)")}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Assistance & Reschedule Row */}
                <div className="px-2 pt-1 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1F6FB2]" />
                    <span>{isAr ? 'يرجى مراجعة موظف الاستقبال عند وصولك لتأكيد الدخول.' : 'Please check in at the clinic reception desk when you arrive.'}</span>
                  </div>
                  <Link
                    href="/portal/appointments"
                    className="font-bold text-[#1F6FB2] hover:underline inline-flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{isAr ? 'طلب تعديل الموعد' : 'Request Reschedule'}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <Calendar className="w-12 h-12 text-eb-muted/40 mx-auto" />
                <h3 className="text-sm font-bold text-eb-ink">
                  {isAr ? 'لا يوجد لديك موعد قادم مؤكد حالياً' : 'No confirmed upcoming appointment'}
                </h3>
                <p className="text-xs text-eb-muted max-w-sm mx-auto">
                  {isAr
                    ? 'اختر الفرع والخدمة المرغوبة وسيقوم موظف الاستقبال بمراجعة جدول الأطباء وتأكيد موعدك.'
                    : 'Submit a visit request with your preferred doctor and clinic branch.'}
                </p>
                <div className="pt-2">
                  <Link
                    href="/portal/appointments"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-eb-blue hover:bg-eb-navy text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isAr ? 'طلب موعد كشف جديد' : 'Request Appointment Now'}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          {nextAppointment && (
            <div className="pt-5 mt-5 border-t border-eb-line flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-eb-muted text-[11px]">
                {isAr ? 'سياسة الإلغاء: يلزم إخطار مسبق بـ ٢٤ ساعة' : 'Cancellation Policy: 24h advance notice required'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  className="eb-semantic-action eb-semantic-action--neutral eb-semantic-action--small"
                >
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true"/>{isAr ? 'طلب تعديل الموعد' : 'Request Reschedule'}
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="eb-semantic-action eb-semantic-action--danger eb-semantic-action--small"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true"/>{isAr ? 'إلغاء الموعد' : 'Cancel Appointment'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* My Next Actions Queue (5 / 12 columns) */}
        <div className="lg:col-span-5 bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-eb-line mb-4">
              <h2 className="text-base font-serif font-bold text-eb-ink flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-eb-orange/10 text-eb-orange">
                  <AlertCircle className="w-4 h-4" />
                </span>
                <span>{isAr ? 'الإجراءات المطلوبة مني' : 'My Next Actions'}</span>
              </h2>
              <span className="text-[11px] font-bold text-eb-muted font-mono">
                {isAr ? 'قائمة المهام' : 'ACTION QUEUE'}
              </span>
            </div>

            <div className="space-y-3">
              {/* Task 1: Medical Intake status */}
              {!latestSubmission ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <PriorityIndicator priority="high" isArabic={isAr} />
                    <span className="text-[10px] text-amber-700 font-mono">STEP 1</span>
                  </div>
                  <h4 className="font-bold text-slate-900">
                    {isAr ? 'استبيان التاريخ الطبي غير مكتمل' : 'Pre-Visit Medical Intake Required'}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    {isAr ? 'يرجى تقديم بيانات الحساسية والأمراض المزمنة قبل موعد الكشف لضمان سلامتك السريرية.' : 'Required for your treating dentist to verify allergies and medical safety.'}
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/portal/intake"
                      className="text-xs font-bold text-eb-blue hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isAr ? 'بدء ملء الاستبيان' : 'Complete Intake Questionnaire'}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              ) : latestSubmission.status === 'DRAFT' ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <PriorityIndicator priority="high" isArabic={isAr} />
                    <span className="text-[10px] text-amber-700 font-mono">DRAFT</span>
                  </div>
                  <h4 className="font-bold text-slate-900">
                    {isAr ? 'لديك مسودة استبيان طبي محفوظة' : 'Draft Medical Intake Saved'}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    {isAr ? 'أكمل الإجابة على الأسئلة واعتمدها لتصبح جاهزة لمراجعة الطبيب.' : 'Review and submit your draft so your treating doctor can sign off.'}
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/portal/intake"
                      className="text-xs font-bold text-eb-blue hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isAr ? 'استكمال المسودة وإرسالها' : 'Resume & Submit'}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              ) : null}

              {/* Task 2: Alternative slot proposal awaiting response */}
              {initialRequests.some((r) => r.status === 'ALTERNATIVE_PROPOSED') && (
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <PriorityIndicator priority="urgent" isArabic={isAr} />
                    <StatusTag variant="proposed" label={isAr ? 'عرض بديل' : 'Slot Offer'} size="sm" />
                  </div>
                  <h4 className="font-bold text-slate-900">
                    {isAr ? 'عرض موعد بديل بانتظار موافقتك' : 'Alternative Visit Slot Offered'}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    {isAr ? 'قدمت العيادة موعداً بديلاً مناسباً لطلبك. يرجى تأكيده أو اختيار موعد آخر.' : 'Reception offered a new slot for your booking. Please accept or decline in your appointments tab.'}
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/portal/appointments"
                      className="text-xs font-bold text-eb-blue hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isAr ? 'مراجعة الموعد المعروض' : 'Review Offered Slot'}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Task 3: Unpaid verified balance reminder */}
              {billingSummary.totalBalanceDue > 0 ? (
                <div className="p-3.5 rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] text-rose-700 font-bold uppercase">{isAr ? 'مستحق الدفع' : 'Payment Due'}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">
                    {isAr ? 'رصيد علاجي مستحق الدفع' : 'Outstanding Treatment Balance Due'}
                  </h4>
                  <p className="text-[11px] text-slate-700">
                    {isAr 
                      ? `متبقي: ${(billingSummary.totalBalanceDue / 100).toLocaleString()} ج.م (يمكن سداده بمكتب الاستقبال أو أونلاين).`
                      : `Current due: ${(billingSummary.totalBalanceDue / 100).toLocaleString()} EGP (payable at reception desk).`}
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/portal/billing"
                      className="text-xs font-bold text-rose-800 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isAr ? 'عرض الفواتير والإيصالات' : 'View Invoices & Receipts'}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#E8F7F3] border border-[#B0E4D8] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-emerald-700 font-bold uppercase">{isAr ? 'حسابك مسدد بالكامل' : 'All Settled'}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">
                    {isAr ? 'جميع الفواتير والمدفوعات مسددة' : 'Zero Outstanding Balances'}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    {isAr ? 'شكراً لالتزامك، حسابك المالي لدى ابتسامتي في أفضل حالة.' : 'Thank you! Your patient financial ledger is clean and in good standing.'}
                  </p>
                </div>
              )}

              {/* Fallback empty actions state */}
              {latestSubmission && latestSubmission.status === 'REVIEWED' && billingSummary.totalBalanceDue === 0 && !initialRequests.some((r) => r.status === 'ALTERNATIVE_PROPOSED') && (
                <div className="p-6 text-center text-xs text-eb-muted space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-slate-800">
                    {isAr ? 'ملفك الطبي وإجراءاتك محدثة بالكامل' : 'All actions up to date!'}
                  </p>
                  <p className="text-[11px]">
                    {isAr ? 'لا توجد متطلبات معلقة أو فواتير متأخرة حالياً.' : 'No pending health intake updates or outstanding invoices at this time.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-eb-line text-[11px] text-eb-muted flex items-center justify-between">
            <span>{isAr ? 'التحديث الآلي للملف' : 'Automated Sync'}</span>
            <span className="font-mono text-emerald-700 font-bold">{isAr ? 'متصل ومحمي' : 'Active & Verified'}</span>
          </div>
        </div>
      </div>

      {/* Second Row: Care Timeline (Horizontal Stepper) vs Planned Care / Treatment Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Care Timeline Stepper (7 / 12 columns) */}
        <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#163447] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1356CC]" />
                <span>{isAr ? 'الجدول الزمني للعلاج' : 'Your Care Timeline'}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'مواعيد المتابعة والإجراءات المخططة' : 'Your follow-up visits and planned care'}
              </p>
            </div>
            <Link
              href="/portal/appointments"
              className="text-xs font-bold text-[#1356CC] hover:underline inline-flex items-center gap-1"
            >
              <span>{isAr ? 'عرض الجدول بالكامل' : 'View Full Schedule'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>

          {/* Connected Horizontal Stepper */}
          <div className="relative pt-2 pb-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
              {/* Step 1 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {isAr ? 'مكتمل' : 'Completed'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">Nov 1, 2026</span>
                  <span className="text-xs font-bold text-slate-900 leading-tight block mt-0.5">
                    {isAr ? 'جلسة المتابعة' : 'Follow-up Visit'}
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-[#1356CC] text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#1356CC]">
                    {isAr ? 'مؤكد' : 'Confirmed'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">Nov 8, 2026</span>
                  <span className="text-xs font-bold text-slate-900 leading-tight block mt-0.5">
                    {isAr ? 'مقاس التاج ومطابقة اللون' : 'Digital Crown Impression & Shade Matching'}
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {isAr ? 'مخطط' : 'Planned'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">Dec 12, 2026</span>
                  <span className="text-xs font-bold text-slate-900 leading-tight block mt-0.5">
                    {isAr ? 'بناء الدعامة والقلب' : 'Post & Core Build-Up (Planned)'}
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {isAr ? 'مخطط' : 'Planned'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">Jan 11, 2027</span>
                  <span className="text-xs font-bold text-slate-900 leading-tight block mt-0.5">
                    {isAr ? 'تركيب التاج الخزفي' : 'Ceramic Crown (Planned)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Planned Care / Treatment Plan (5 / 12 columns) */}
        <div className="lg:col-span-5 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#163447] flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#F59B20]" />
                <span>{isAr ? 'خطة العلاج المعتمدة' : 'Planned Care / Treatment Plan'}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'خطة علاجك الإكلينيكية المعتمدة' : 'Your approved treatment plan'}
              </p>
            </div>
            <Link
              href="/portal/billing"
              className="text-xs font-bold text-[#1356CC] hover:underline"
            >
              {isAr ? 'التفاصيل' : 'View Details →'}
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm block">Quadrant 3 Rehabilitation</span>
                <span className="text-[10px] text-slate-500">
                  {isAr ? 'تمت المرحلة 1. المرحلتان 2 و 3 قيد التخطيط.' : 'Phase 1 completed. Phase 2 and 3 are planned.'}
                </span>
              </div>
              <span className="font-mono text-purple-900 font-bold text-xs bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs">
                {isAr ? 'التقديري' : 'Estimated Total'}: 4,500 EGP
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-purple-200/60 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-purple-100/60">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    COMPLETED
                  </span>
                  <span className="text-slate-800 font-medium">Root Canal Treatment #36</span>
                </div>
                <span className="font-mono text-slate-600 font-semibold">2,500 EGP</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-purple-100/60">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800">
                    PLANNED
                  </span>
                  <span className="text-slate-800 font-medium">Post &amp; Core #36</span>
                </div>
                <span className="font-mono text-slate-600 font-semibold">1,000 EGP</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800">
                    PLANNED
                  </span>
                  <span className="text-slate-800 font-medium">Ceramic Crown (Tooth #36)</span>
                </div>
                <span className="font-mono text-slate-600 font-semibold">3,500 EGP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Payments, Installments & Separated Estimates */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-eb-line shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-eb-line gap-3">
          <div>
            <h3 className="text-lg font-serif font-bold text-eb-ink flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>{isAr ? 'البيان المالي والأقساط والتقديرات المستقبلية' : 'Financial Statement, Installments & Estimates'}</span>
            </h3>
            <p className="text-xs text-eb-muted">
              {isAr
                ? 'فصل تام بين الرصيد الفعلي المستحق حالياً وتكلفة العلاج المستقبلية التقديرية'
                : 'Strict distinction between verified due balances, scheduled installments, and unbilled future treatment estimates'}
            </p>
          </div>
          <Link
            href="/portal/billing"
            className="text-xs font-bold text-eb-blue hover:underline inline-flex items-center gap-1"
          >
            <span>{isAr ? 'عرض تفاصيل الفواتير الكاملة' : 'View Full Schedule & Receipts'}</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Verified Outstanding Balance */}
          <div className="p-5 rounded-2xl bg-eb-ivory border border-eb-line">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              {isAr ? 'الرصيد الفعلي المستحق حالياً' : 'Verified Outstanding Balance'}
            </span>
            <div className="text-2xl font-bold text-eb-ink mt-1">
              {patient?.migrationStatus && patient.migrationStatus !== 'FULLY_DIGITIZED' && billingSummary.invoicesCount === 0
                ? (isAr ? 'قيد المراجعة' : 'Under Verification')
                : (
                  <>
                    {(billingSummary.totalBalanceDue / 100).toLocaleString()}{' '}
                    <span className="text-xs font-normal text-eb-muted">EGP</span>
                  </>
                )}
            </div>
            <span className="text-[11px] text-eb-muted mt-1 block">
              {billingSummary.invoicesCount > 0
                ? (isAr
                    ? `إجمالي الفواتير: ${(billingSummary.totalInvoiced / 100).toLocaleString()} ج.م • المدفوع: ${(billingSummary.totalPaid / 100).toLocaleString()} ج.م`
                    : `Invoiced: ${(billingSummary.totalInvoiced / 100).toLocaleString()} EGP • Paid: ${(billingSummary.totalPaid / 100).toLocaleString()} EGP`)
                : (isAr ? 'جميع الفواتير مسددة بالكامل' : 'All verified invoices settled')}
            </span>
          </div>

          {/* Card 2: Next Scheduled Installment */}
          <div className="p-5 rounded-2xl bg-eb-ivory border border-eb-line">
            <span className="text-[11px] font-bold text-eb-blue uppercase tracking-wider block">
              {isAr ? 'القسط القادم المجدول' : 'Next Scheduled Installment'}
            </span>
            <div className="text-2xl font-bold text-eb-ink mt-1">
              {installments[0]
                ? `${(installments[0].amountPiasters / 100).toLocaleString()} EGP`
                : isAr ? 'لا يوجد أقساط' : 'None Due'}
            </div>
            <span className="text-[11px] text-eb-muted mt-1 block">
              {installments[0]
                ? `${isAr ? 'تاريخ الاستحقاق' : 'Due'}: ${new Date(installments[0].dueDate).toLocaleDateString()} (${installments.length} ${isAr ? 'أقساط متبقية' : 'scheduled installments'})`
                : isAr ? 'لا توجد خطة أقساط جارية' : 'No active installment schedule'}
            </span>
          </div>

          {/* Card 3: Separately Labeled Estimated Treatment Cost */}
          <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block flex items-center gap-1.5">
              <span>{isAr ? 'تكلفة العلاج المستقبلية (تقديرية)' : 'Estimated Future Treatment Cost'}</span>
            </span>
            <div className="text-2xl font-bold text-purple-950 mt-1">
              {(estimatedTreatmentCostPiasters / 100).toLocaleString()}{' '}
              <span className="text-xs font-normal text-purple-700">EGP</span>
            </div>
            <span className="text-[11px] text-purple-800/80 mt-1 block">
              {isAr
                ? 'تقدير للإجراءات المخططة غير المفوترة — ليس التزاماً مالياً حالياً'
                : 'Unbilled estimate for PLANNED items — NOT a confirmed payment due'}
            </span>
          </div>
        </div>

        {/* Future Installments Schedule (Max 3 distinct obligations shown) */}
        {installments.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-eb-ink uppercase tracking-wider">
                {isAr ? 'جدول الأقساط القادمة (مرتبط بالرصيد المستحق)' : 'Upcoming Installment Schedule (Part of Verified Balance Due)'}
              </h4>
              <Link href="/portal/billing" className="text-[11px] font-semibold text-eb-blue hover:underline">
                {isAr ? 'عرض الجدول الكامل' : 'View full schedule'}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {installments.slice(0, 3).map((inst: any) => (
                <div key={inst.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {isAr ? `القسط #${inst.installmentNumber}` : `Installment #${inst.installmentNumber}`}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(inst.dueDate).toLocaleDateString()} • {inst.status}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">
                    {(inst.amountPiasters / 100).toLocaleString()} EGP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fourth Row: Medical Intake & Portal Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-eb-line shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-eb-line">
            <h2 className="text-base font-serif font-bold text-eb-ink">
              {isAr ? 'الاستبيان الطبي قبل الزيارة' : 'Pre-Visit Medical Intake'}
            </h2>
            <StatusTag
              variant={latestSubmission?.status === 'REVIEWED' ? 'verified' : 'warning'}
              label={latestSubmission?.status || 'NOT_STARTED'}
              size="sm"
            />
          </div>
          <p className="text-xs text-eb-muted leading-relaxed">
            {isAr
              ? 'يتم حفظ كل تحديث لتاريخك الطبي كإصدار مستقل لمراجعته واعتماده من طبيبك المعالج.'
              : 'Every medical history disclosure is versioned and routed to your assigned treating dentist for clinical sign-off.'}
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-eb-line/60">
            <h3 className="text-xs font-bold text-eb-ink">
              {isAr ? 'سجل الإصدارات والمراجعة الطبية' : 'Versioned Intake & Audit History'}
            </h3>
            <Link href="/portal/intake" className="text-xs font-bold text-eb-blue hover:underline inline-flex items-center gap-1">
              <span>{isAr ? 'فتح الاستبيان الطبي' : 'Open Medical Intake'}</span>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-eb-line shadow-subtle space-y-3">
          <h3 className="text-base font-serif font-bold text-eb-ink pb-3 border-b border-eb-line">
            {isAr ? 'خدمات البوابة السريعة' : 'Patient Portal Self-Service'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <Link href="/portal/appointments" className="p-3.5 rounded-2xl bg-eb-ivory hover:bg-eb-bone border border-eb-line transition-colors block">
              <span className="font-bold text-eb-ink block">Visits, Appointments & Fast Check-In</span>
              <span className="text-[11px] text-eb-muted mt-1 block">Manage bookings & offers</span>
            </Link>
            <Link href="/portal/billing" className="p-3.5 rounded-2xl bg-eb-ivory hover:bg-eb-bone border border-eb-line transition-colors block">
              <span className="font-bold text-eb-ink block">Financial Records & Payment Plans</span>
              <span className="text-[11px] text-eb-muted mt-1 block">Invoices, receipts & installments</span>
            </Link>
            <Link href="/portal/check-in" className="p-3.5 rounded-2xl bg-eb-ivory hover:bg-eb-bone border border-eb-line transition-colors block">
              <span className="font-bold text-eb-ink block">Self Check-In & Queue</span>
              <span className="text-[11px] text-eb-muted mt-1 block">Report clinic arrival</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>{isAr ? 'تأكيد إلغاء الموعد' : 'Cancel Appointment Booking'}</span>
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'تنص سياسة العيادة على إلغاء الموعد قبل ٢٤ ساعة على الأقل. سيتم إلغاء الحجز فوراً وتحرير وقت الطبيب لمرضى الطوارئ.'
                : 'Appointments must be cancelled at least 24 hours in advance. This releases the slot for other patients and stops obsolete reminders.'}
            </p>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'سبب الإلغاء (اختياري)' : 'Reason for cancellation (optional)'}
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={isAr ? 'مثال: ظرف طارئ، سفر...' : 'e.g. Schedule conflict, feeling unwell...'}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                rows={2}
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
              >
                {isAr ? 'تراجع' : 'Keep Booking'}
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={cancelLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {cancelLoading ? (isAr ? 'جاري الإلغاء...' : 'Cancelling...') : (isAr ? 'تأكيد الإلغاء' : 'Confirm Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-eb-blue" />
                <span>{isAr ? 'طلب موعد بديل' : 'Request Appointment Reschedule'}</span>
              </h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'حدد التاريخ والفترة الزمنية المناسبة. سيقوم مكتب الاستقبال بمراجعة جدول الطبيب وتأكيد الموعد البديل فوراً.'
                : 'Select your preferred date and time. Reception will check doctor duty and confirm your new slot.'}
            </p>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {rescheduleError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'التاريخ المطلوب الجديد' : 'New Preferred Date'}
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'الفترة اليومية المفضلة' : 'Preferred Time Window'}
                </label>
                <select
                  value={rescheduleTimeWindow}
                  onChange={(e) => setRescheduleTimeWindow(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="MORNING">{isAr ? 'صباحاً (٠٩:٠٠ ص – ٠١:٠٠ م)' : 'Morning (09:00 AM – 01:00 PM)'}</option>
                  <option value="AFTERNOON">{isAr ? 'ظهراً (٠١:٠٠ م – ٠٥:٠٠ م)' : 'Afternoon (01:00 PM – 05:00 PM)'}</option>
                  <option value="EVENING">{isAr ? 'مساءً (٠٥:٠٠ م – ٠٩:٠٠ م)' : 'Evening (05:00 PM – 09:00 PM)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'ملاحظة لموظف الاستقبال' : 'Note for reception (optional)'}
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder={isAr ? 'سبب التعديل...' : 'Reason for reschedule...'}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
              >
                {isAr ? 'إلغاء' : 'Close'}
              </button>
              <button
                onClick={handleRescheduleAppointment}
                disabled={rescheduleLoading}
                className="flex-1 py-2.5 bg-eb-blue hover:bg-eb-navy text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {rescheduleLoading ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : (isAr ? 'إرسال طلب التعديل' : 'Submit Request')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDashboardClient;
