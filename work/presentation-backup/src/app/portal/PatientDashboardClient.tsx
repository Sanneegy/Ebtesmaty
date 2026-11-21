'use client';
import {localizedText} from '@/lib/interface-messages';


import {useLanguage} from '@/context/LanguageContext';
import {localDate,money} from '@/lib/messages';
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
  isAr: _initialIsAr,
}: PatientDashboardProps) {
  const {locale}=useLanguage();const isAr=locale==='ar';
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

  return (
    <div className="eb-patient-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir={localizedText(isAr ? 'ar' : 'en', 'text_52b133b060')}>
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
              <span>{localizedText(isAr ? 'ar' : 'en', 'text_c4583c40fb')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {isAr ? `أهلاً بك، ${user.fullName.split(' ')[0]}` : `Welcome back, ${user.fullName.split(' ')[0]}!`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              {localizedText(isAr ? 'ar' : 'en', 'text_025b00525d')}
            </p>
            {patient && (
              <div className="pt-1">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                  {localizedText(isAr ? 'ar' : 'en', 'text_87d8444da0')}{patient.patientNumber}
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
              <span>{localizedText(isAr ? 'ar' : 'en', 'text_bb216cef79')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/portal/intake"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <HeartPulse className="w-4 h-4 text-[#0F827B]" />
              <span>{localizedText(isAr ? 'ar' : 'en', 'text_c53c9e532b')}</span>
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <PlusCircle className="w-4 h-4 text-[#0F827B]" />
              <span>{localizedText(isAr ? 'ar' : 'en', 'text_18223fc4a2')}</span>
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
                <strong className="text-xs font-bold text-slate-900 block">{localizedText(isAr ? 'ar' : 'en', 'text_865a723ec5')}</strong>
                <span className="text-xs text-slate-400">{localizedText(isAr ? 'ar' : 'en', 'text_434fd0cde4')}</span>
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
                <strong className="text-xs font-bold text-slate-900 block">{localizedText(isAr ? 'ar' : 'en', 'text_7efb3d4076')}</strong>
                <span className="text-xs text-slate-400">{localizedText(isAr ? 'ar' : 'en', 'text_c95dd1e65a')}</span>
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
                <strong className="text-xs font-bold text-slate-900 block">{localizedText(isAr ? 'ar' : 'en', 'text_289db8b8e8')}</strong>
                <span className="text-xs text-slate-400">{localizedText(isAr ? 'ar' : 'en', 'text_0d99389468')}</span>
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
                    {localizedText(isAr ? 'ar' : 'en', 'text_e33ec64609')}
                  </h2>
                  <span className="text-xs text-eb-muted">
                    {localizedText(isAr ? 'ar' : 'en', 'text_cf5cc7b773')}
                  </span>
                </div>
              </div>
              {nextAppointment ? (
                <StatusTag variant="verified" label={nextAppointment.status} size="sm" />
              ) : (
                <StatusTag variant="neutral" label={localizedText(isAr ? 'ar' : 'en', 'text_c74f1d5020')} size="sm" />
              )}
            </div>

            {nextAppointment ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#F7F8F5] border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    {/* Functional Visual Calendar Date Tile */}
                    <div className="w-16 h-16 rounded-2xl bg-[#176C5B] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span className="text-xs font-mono uppercase tracking-wider text-emerald-100">
                        {new Date(nextAppointment.appointmentDate).toLocaleDateString(localizedText(isAr ? 'ar' : 'en', 'text_fd51b0b7e8'), { month: 'short' })}
                      </span>
                      <span className="text-2xl font-extrabold leading-none mt-0.5">
                        {new Date(nextAppointment.appointmentDate).getDate()}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-[#176C5B] block uppercase tracking-wider font-mono">
                        {nextAppointment.serviceDescription}
                      </span>
                      <h3 className="text-lg font-bold text-[#163447] mt-0.5">
                        {new Date(nextAppointment.appointmentDate).toLocaleDateString(localizedText(isAr ? 'ar' : 'en', 'text_fd51b0b7e8'), {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[#176C5B]">
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

                  <p className="text-sm text-slate-700">{localizedText(isAr ? 'ar' : 'en', 'text_104288f843')}</p>
                </div>

                {/* Bottom Assistance & Reschedule Row */}
                <div className="px-2 pt-1 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#176C5B]" />
                    <span>{localizedText(isAr ? 'ar' : 'en', 'text_38178e0a2a')}</span>
                  </div>
                  <Link
                    href="/portal/appointments"
                    className="font-bold text-[#176C5B] hover:underline inline-flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{localizedText(isAr ? 'ar' : 'en', 'text_419b5f84ec')}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <Calendar className="w-12 h-12 text-eb-muted/40 mx-auto" />
                <h3 className="text-sm font-bold text-eb-ink">
                  {localizedText(isAr ? 'ar' : 'en', 'text_aacb80a8de')}
                </h3>
                <p className="text-xs text-eb-muted max-w-sm mx-auto">
                  {localizedText(isAr ? 'ar' : 'en', 'text_9820af7e7f')}
                </p>
                <div className="pt-2">
                  <Link
                    href="/portal/appointments"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-eb-blue hover:bg-eb-navy text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{localizedText(isAr ? 'ar' : 'en', 'text_10d4287baf')}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          {nextAppointment && (
            <div className="pt-5 mt-5 border-t border-eb-line flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-eb-muted text-xs">
                {localizedText(isAr ? 'ar' : 'en', 'text_a39a4aba85')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  className="eb-semantic-action eb-semantic-action--neutral eb-semantic-action--small"
                >
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true"/>{localizedText(isAr ? 'ar' : 'en', 'text_419b5f84ec')}
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="eb-semantic-action eb-semantic-action--danger eb-semantic-action--small"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true"/>{localizedText(isAr ? 'ar' : 'en', 'text_1cff7f6ed2')}
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
                <span>{localizedText(isAr ? 'ar' : 'en', 'text_402188dfc2')}</span>
              </h2>
              <span className="text-xs font-bold text-eb-muted font-mono">
                {localizedText(isAr ? 'ar' : 'en', 'text_56ad8f73af')}
              </span>
            </div>

            <div className="space-y-3">
              {/* Task 1: Medical Intake status */}
              {!latestSubmission ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <PriorityIndicator priority="high" isArabic={isAr} />
                    <span className="text-xs text-amber-700 font-mono">STEP 1</span>
                  </div>
                  <h4 className="font-bold text-slate-900">
                    {localizedText(isAr ? 'ar' : 'en', 'text_c7aebab631')}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {localizedText(isAr ? 'ar' : 'en', 'text_f20cfecf76')}
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/portal/intake"
                      className="text-xs font-bold text-eb-blue hover:underline inline-flex items-center gap-1"
                    >
                      <span>{localizedText(isAr ? 'ar' : 'en', 'text_76890e7324')}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              ) : latestSubmission.status === 'DRAFT' ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <PriorityIndicator priority="high" isArabic={isAr} />
                    <span className="text-xs text-amber-700 font-mono">DRAFT</span>
                  </div>
                  <h4 className="font-bold text-slate-900">
                    {localizedText(isAr ? 'ar' : 'en', 'text_16ee7b626b')}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {localizedText(isAr ? 'ar' : 'en', 'text_2f4f5792f5')}
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/portal/intake"
                      className="text-xs font-bold text-eb-blue hover:underline inline-flex items-center gap-1"
                    >
                      <span>{localizedText(isAr ? 'ar' : 'en', 'text_dca306de77')}</span>
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
                    <StatusTag variant="proposed" label={localizedText(isAr ? 'ar' : 'en', 'text_5b1c5a4111')} size="sm" />
                  </div>
                  <h4 className="font-bold text-slate-900">
                    {localizedText(isAr ? 'ar' : 'en', 'text_85a7b0d4b5')}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {localizedText(isAr ? 'ar' : 'en', 'text_cf1fee9e26')}
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/portal/appointments"
                      className="text-xs font-bold text-eb-blue hover:underline inline-flex items-center gap-1"
                    >
                      <span>{localizedText(isAr ? 'ar' : 'en', 'text_74d332021d')}</span>
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
                    <span className="text-xs text-rose-700 font-bold uppercase">{localizedText(isAr ? 'ar' : 'en', 'text_ed700ba938')}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">
                    {localizedText(isAr ? 'ar' : 'en', 'text_6bddddbe19')}
                  </h4>
                  <p className="text-xs text-slate-700">
                    {isAr 
                      ? `متبقي: ${(billingSummary.totalBalanceDue / 100).toLocaleString()} ج.م (يمكن سداده بمكتب الاستقبال أو أونلاين).`
                      : `Current due: ${(billingSummary.totalBalanceDue / 100).toLocaleString()} EGP (payable at reception desk).`}
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/portal/billing"
                      className="text-xs font-bold text-rose-800 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{localizedText(isAr ? 'ar' : 'en', 'text_eecada0c08')}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#E8F7F3] border border-[#B0E4D8] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs text-emerald-700 font-bold uppercase">{localizedText(isAr ? 'ar' : 'en', 'text_77a09d88a7')}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">
                    {localizedText(isAr ? 'ar' : 'en', 'text_c937c4230b')}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {localizedText(isAr ? 'ar' : 'en', 'text_c4789dab65')}
                  </p>
                </div>
              )}

              {/* Fallback empty actions state */}
              {latestSubmission && latestSubmission.status === 'REVIEWED' && billingSummary.totalBalanceDue === 0 && !initialRequests.some((r) => r.status === 'ALTERNATIVE_PROPOSED') && (
                <div className="p-6 text-center text-xs text-eb-muted space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-slate-800">
                    {localizedText(isAr ? 'ar' : 'en', 'text_2237ad34a5')}
                  </p>
                  <p className="text-xs">
                    {localizedText(isAr ? 'ar' : 'en', 'text_d16784cd48')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-eb-line text-xs text-eb-muted flex items-center justify-between">
            <span>{localizedText(isAr ? 'ar' : 'en', 'text_a6fd4add99')}</span>
            <span className="font-mono text-emerald-700 font-bold">{localizedText(isAr ? 'ar' : 'en', 'text_20653af05e')}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="surface-card"><h2>{isAr?'مواعيدك القادمة':'Your upcoming visits'}</h2>{careTimeline.length?careTimeline.map(visit=><div key={visit.id} className="py-4 border-b"><p className="font-semibold">{visit.serviceDescription}</p><p>{localDate(visit.appointmentDate,locale)} · <bdi>{visit.startTime}</bdi></p><p>{visit.dentistUser?.fullName}</p></div>):<p>{isAr?'لا توجد مواعيد مؤكدة قادمة.':'No confirmed upcoming visits.'}</p>}<Link className="secondary-button mt-4" href="/portal/appointments">{isAr?'إدارة المواعيد':'Manage appointments'}</Link></section>
        <section className="surface-card"><h2>{isAr?'خطة علاجك':'Your treatment plan'}</h2><p className="text-sm text-slate-600">{isAr?'هذه تقديرات للعلاج وليست مبالغ مستحقة للدفع. اسأل طبيبك عن أي مصطلح غير واضح.':'These are treatment estimates, separate from bills due. Ask your dentist about any unfamiliar term.'}</p>{treatmentPlans.length?treatmentPlans.map(plan=><div key={plan.id} className="py-4"><h3 className="font-semibold">{plan.title}</h3><ul className="divide-y">{plan.items.map((item:any)=><li key={item.id} className="py-3 flex justify-between gap-3"><span>{item.procedureName}{item.toothNumber&&<bdi className="ms-2">#{item.toothNumber}</bdi>}</span><span className="tabular-nums">{money(item.estimatedCostPiasters,locale)}</span></li>)}</ul></div>):<p>{isAr?'لا توجد خطة علاج مشتركة بعد.':'No shared treatment plan yet.'}</p>}<Link href="/portal/records" className="secondary-button">{isAr?'عرض سجلاتي':'View my records'}</Link></section>
      </div>

      {/* Third Row: Payments, Installments & Separated Estimates */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-eb-line shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-eb-line gap-3">
          <div>
            <h3 className="text-lg font-serif font-bold text-eb-ink flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>{localizedText(isAr ? 'ar' : 'en', 'text_252df3b871')}</span>
            </h3>
            <p className="text-xs text-eb-muted">
              {localizedText(isAr ? 'ar' : 'en', 'text_f479a7572e')}
            </p>
          </div>
          <Link
            href="/portal/billing"
            className="text-xs font-bold text-eb-blue hover:underline inline-flex items-center gap-1"
          >
            <span>{localizedText(isAr ? 'ar' : 'en', 'text_b2ea1ad300')}</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Verified Outstanding Balance */}
          <div className="p-5 rounded-2xl bg-eb-ivory border border-eb-line">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
              {localizedText(isAr ? 'ar' : 'en', 'text_dd4761a11d')}
            </span>
            <div className="text-2xl font-bold text-eb-ink mt-1">
              {patient?.migrationStatus && patient.migrationStatus !== 'FULLY_DIGITIZED' && billingSummary.invoicesCount === 0
                ? (localizedText(isAr ? 'ar' : 'en', 'text_f397e23cfb'))
                : (
                  <>
                    {(billingSummary.totalBalanceDue / 100).toLocaleString()}{' '}
                    <span className="text-xs font-normal text-eb-muted">EGP</span>
                  </>
                )}
            </div>
            <span className="text-xs text-eb-muted mt-1 block">
              {billingSummary.invoicesCount > 0
                ? (isAr
                    ? `إجمالي الفواتير: ${(billingSummary.totalInvoiced / 100).toLocaleString()} ج.م • المدفوع: ${(billingSummary.totalPaid / 100).toLocaleString()} ج.م`
                    : `Invoiced: ${(billingSummary.totalInvoiced / 100).toLocaleString()} EGP • Paid: ${(billingSummary.totalPaid / 100).toLocaleString()} EGP`)
                : (localizedText(isAr ? 'ar' : 'en', 'text_ee1d8d8471'))}
            </span>
          </div>

          {/* Card 2: Next Scheduled Installment */}
          <div className="p-5 rounded-2xl bg-eb-ivory border border-eb-line">
            <span className="text-xs font-bold text-eb-blue uppercase tracking-wider block">
              {localizedText(isAr ? 'ar' : 'en', 'text_0c037d9365')}
            </span>
            <div className="text-2xl font-bold text-eb-ink mt-1">
              {installments[0]
                ? `${(installments[0].amountPiasters / 100).toLocaleString()} EGP`
                : localizedText(isAr ? 'ar' : 'en', 'text_23e9b3365b')}
            </div>
            <span className="text-xs text-eb-muted mt-1 block">
              {installments[0]
                ? `${localizedText(isAr ? 'ar' : 'en', 'text_e4c6b28a27')}: ${new Date(installments[0].dueDate).toLocaleDateString()} (${installments.length} ${localizedText(isAr ? 'ar' : 'en', 'text_383e663481')})`
                : localizedText(isAr ? 'ar' : 'en', 'text_3ac5a2d843')}
            </span>
          </div>

          {/* Card 3: Separately Labeled Estimated Treatment Cost */}
          <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block flex items-center gap-1.5">
              <span>{localizedText(isAr ? 'ar' : 'en', 'text_da2760a450')}</span>
            </span>
            <div className="text-2xl font-bold text-purple-950 mt-1">
              {(estimatedTreatmentCostPiasters / 100).toLocaleString()}{' '}
              <span className="text-xs font-normal text-purple-700">EGP</span>
            </div>
            <span className="text-xs text-purple-800/80 mt-1 block">
              {localizedText(isAr ? 'ar' : 'en', 'text_1a704c2090')}
            </span>
          </div>
        </div>

        {/* Future Installments Schedule (Max 3 distinct obligations shown) */}
        {installments.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-eb-ink uppercase tracking-wider">
                {localizedText(isAr ? 'ar' : 'en', 'text_cd5a539a4b')}
              </h4>
              <Link href="/portal/billing" className="text-xs font-semibold text-eb-blue hover:underline">
                {localizedText(isAr ? 'ar' : 'en', 'text_23abdbeee5')}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {installments.slice(0, 3).map((inst: any) => (
                <div key={inst.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {isAr ? `القسط #${inst.installmentNumber}` : `Installment #${inst.installmentNumber}`}
                    </span>
                    <span className="text-xs text-slate-500">
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
              {localizedText(isAr ? 'ar' : 'en', 'text_a9cd4c2288')}
            </h2>
            <StatusTag
              variant={latestSubmission?.status === 'REVIEWED' ? 'verified' : 'warning'}
              label={latestSubmission?.status || 'NOT_STARTED'}
              size="sm"
            />
          </div>
          <p className="text-xs text-eb-muted leading-relaxed">
            {localizedText(isAr ? 'ar' : 'en', 'text_ad0ee8a8a7')}
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-eb-line/60">
            <h3 className="text-xs font-bold text-eb-ink">
              {localizedText(isAr ? 'ar' : 'en', 'text_1a075866ed')}
            </h3>
            <Link href="/portal/intake" className="text-xs font-bold text-eb-blue hover:underline inline-flex items-center gap-1">
              <span>{localizedText(isAr ? 'ar' : 'en', 'text_29a0c46ed5')}</span>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-eb-line shadow-subtle space-y-3">
          <h3 className="text-base font-serif font-bold text-eb-ink pb-3 border-b border-eb-line">
            {localizedText(isAr ? 'ar' : 'en', 'text_b89f45277e')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <Link href="/portal/appointments" className="p-3.5 rounded-2xl bg-eb-ivory hover:bg-eb-bone border border-eb-line transition-colors block">
              <span className="font-bold text-eb-ink block">Appointments</span>
              <span className="text-xs text-eb-muted mt-1 block">Manage bookings & offers</span>
            </Link>
            <Link href="/portal/billing" className="p-3.5 rounded-2xl bg-eb-ivory hover:bg-eb-bone border border-eb-line transition-colors block">
              <span className="font-bold text-eb-ink block">Financial Records & Payment Plans</span>
              <span className="text-xs text-eb-muted mt-1 block">Invoices, receipts & installments</span>
            </Link>
            <Link href="/portal/records" className="p-4 rounded-xl border border-eb-line">{localizedText(isAr ? 'ar' : 'en', 'text_edb4f67320')}</Link>
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
                <span>{localizedText(isAr ? 'ar' : 'en', 'text_1377fffacc')}</span>
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {localizedText(isAr ? 'ar' : 'en', 'text_0b69f6928d')}
            </p>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {localizedText(isAr ? 'ar' : 'en', 'text_d9ad75f404')}
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={localizedText(isAr ? 'ar' : 'en', 'text_f0cc60de10')}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                rows={2}
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
              >
                {localizedText(isAr ? 'ar' : 'en', 'text_6cc73543e4')}
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={cancelLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {cancelLoading ? (localizedText(isAr ? 'ar' : 'en', 'text_b74e42efb4')) : (localizedText(isAr ? 'ar' : 'en', 'text_64112c744f'))}
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
                <span>{localizedText(isAr ? 'ar' : 'en', 'text_85c5f8e42c')}</span>
              </h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {localizedText(isAr ? 'ar' : 'en', 'text_1fca02e873')}
            </p>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {rescheduleError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {localizedText(isAr ? 'ar' : 'en', 'text_5c8ad6373e')}
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
                  {localizedText(isAr ? 'ar' : 'en', 'text_a88c488b21')}
                </label>
                <select
                  value={rescheduleTimeWindow}
                  onChange={(e) => setRescheduleTimeWindow(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="MORNING">{localizedText(isAr ? 'ar' : 'en', 'text_db78d62785')}</option>
                  <option value="AFTERNOON">{localizedText(isAr ? 'ar' : 'en', 'text_428053bc22')}</option>
                  <option value="EVENING">{localizedText(isAr ? 'ar' : 'en', 'text_c96fa1f6fa')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {localizedText(isAr ? 'ar' : 'en', 'text_55ee5ed4eb')}
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder={localizedText(isAr ? 'ar' : 'en', 'text_2409b2c38e')}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
              >
                {localizedText(isAr ? 'ar' : 'en', 'text_bda298ca90')}
              </button>
              <button
                onClick={handleRescheduleAppointment}
                disabled={rescheduleLoading}
                className="flex-1 py-2.5 bg-eb-blue hover:bg-eb-navy text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {rescheduleLoading ? (localizedText(isAr ? 'ar' : 'en', 'text_3cc2e71fb4')) : (localizedText(isAr ? 'ar' : 'en', 'text_49ff974f6d'))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDashboardClient;
