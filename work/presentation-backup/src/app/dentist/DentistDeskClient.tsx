'use client';

import {ClinicalPriorityControl} from '@/components/ClinicalPriorityControl';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WorkspaceEmblem } from '@/components/ui/WorkspaceEmblem';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  User,
  FileText,
  ChevronRight,
  Heart,
  Pill,
  AlertTriangle,
  Calendar,
  Wrench,
  X,
  ClipboardCheck,
  Activity,
} from 'lucide-react';

interface Props {
  currentUser: any;
  assignedPatients: any[];
  waitingQueue?: any[];
  todayAppointments?: any[];
  branchAssets?: any[];
}

const FDI_UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const FDI_LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export function DentistDeskClient({
  currentUser,
  assignedPatients: initialPatients,
  waitingQueue = [],
  todayAppointments = [],
  branchAssets = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = searchParams?.get('view') || 'my-day';

  const [patients] = useState(initialPatients);
  const [queue, setQueue] = useState(waitingQueue);
  useEffect(()=>setQueue(waitingQueue),[waitingQueue]);

  // Default to first assigned patient so the center clinical workbench is immediately populated & functional
  const [selectedPatient, setSelectedPatient] = useState<any | null>(initialPatients[0] || null);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(
    initialPatients[0]?.medicalSubmissions?.[0] || null
  );
  const [selectedTooth, setSelectedTooth] = useState<number>(11);
  const [callingId, setCallingId] = useState<string | null>(null);

  // Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewOutcome, setReviewOutcome] = useState<'APPROVED' | 'CLARIFICATION_REQUESTED'>('APPROVED');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Contextual Equipment Fault Report Modal (Allows Dentist to flag broken equipment without full Equipment Admin nav)
  const [showFaultModal, setShowFaultModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(branchAssets[0]?.id || '');
  const [faultSeverity, setFaultSeverity] = useState<'CRITICAL' | 'MAJOR' | 'MINOR'>('MAJOR');
  const [faultDescription, setFaultDescription] = useState('');
  const [faultSaving, setFaultSaving] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<'waiting' | 'intakes' | 'alerts' | null>(null);

  // Intakes pending review across all assigned patients
  const pendingIntakes = patients.flatMap((p) =>
    (p.medicalSubmissions || [])
      .filter((s: any) => s.status === 'PENDING_REVIEW')
      .map((s: any) => ({ ...s, patient: p }))
  );

  const handleOpenReview = (submission: any, patient: any) => {
    setSelectedSubmission(submission);
    setSelectedPatient(patient);
    setClinicalNotes('');
    setReviewOutcome('APPROVED');
    setIsReviewOpen(true);
  };

  const handleTransitionQueue = async (queueId: string, targetStatus: string) => {
    setCallingId(queueId);
    try {
      const res = await fetch(`/api/scheduling/queue/${queueId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({action:({CALLED:'CALL',IN_CONSULTATION:'START',COMPLETED:'COMPLETE'} as Record<string,string>)[targetStatus]||targetStatus}),
      });
      if (res.ok) {
        setQueue(queue.map((q) => (q.id === queueId ? { ...q, status: targetStatus } : q)));
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to transition patient in queue');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCallingId(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setReviewLoading(true);

    try {
      const res = await fetch('/api/intake/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          outcome: reviewOutcome,
          clinicalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReviewSuccess('Clinician review recorded and signed off successfully.');
      setTimeout(() => {
        setIsReviewOpen(false);
        setReviewSuccess(null);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Review failed');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSubmitEquipmentFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;
    setFaultSaving(true);
    try {
      const res = await fetch('/api/equipment/faults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAssetId,
          severity: faultSeverity,
          description: faultDescription || 'Chairside operatory fault reported by treating dentist.',
        }),
      });
      if (res.ok) {
        setShowFaultModal(false);
        setFaultDescription('');
        setActionToast('Operatory equipment fault logged and routed to Maintenance & Branch Management.');
      } else {
        const d = await res.json();
        alert(d.error || 'Could not report fault');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFaultSaving(false);
    }
  };

  const activeWaitingQueue = queue.filter((q) => q.status !== 'COMPLETED');
  const patientFindings = selectedPatient?.toothFindings || [];
  const hasReviewedIntake = selectedPatient?.medicalSubmissions?.some((s: any) => s.status === 'REVIEWED');
  const hasPendingIntake = selectedPatient?.medicalSubmissions?.some((s: any) => s.status === 'PENDING_REVIEW');

  return (
    <div className="eb-role-page eb-dentist max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. MODERN CLINICIAN WORKBENCH HEADER (Matching Image 1 & 5) */}
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#0F827B] text-xs font-bold border border-[#D4F3E2]">
              <span className="w-2 h-2 rounded-full bg-[#0F827B] animate-pulse" />
              <span>CLINICAL WORKSPACE &amp; CHAIRSIDE OPERATORY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {currentUser.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Chairside clinical operatory workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {selectedPatient && (
              <Link
                href={`/dentist/chart/${selectedPatient.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F827B] hover:bg-[#0c6b65] text-white text-xs font-bold shadow-xs transition-all"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Open Chart ({selectedPatient.fullName?.split(' ')[0]})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setShowFaultModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Report Issue</span>
            </button>
          </div>
        </div>

        {/* 3 Quick Metric Pills with Clean Color Accents (No Color Labels) & Click-to-Expand Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div 
            onClick={() => setExpandedMetric(expandedMetric === 'waiting' ? null : 'waiting')}
            className="p-3.5 rounded-2xl bg-[#E8F7F3] border border-[#B0E4D8] flex flex-col justify-between cursor-pointer hover:shadow-xs transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900">Waiting Queue</span>
              </div>
              <span className="text-2xl font-black text-emerald-900 tabular-nums">{activeWaitingQueue.length}</span>
            </div>
            <p className="text-xs text-emerald-700 mt-1 font-medium">Click for details</p>
          </div>

          <div 
            onClick={() => setExpandedMetric(expandedMetric === 'intakes' ? null : 'intakes')}
            className="p-3.5 rounded-2xl bg-[#FEF9C3] border border-[#FDE047] flex flex-col justify-between cursor-pointer hover:shadow-xs transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900">Pending Intakes</span>
              </div>
              <span className="text-2xl font-black text-amber-900 tabular-nums">{pendingIntakes.length}</span>
            </div>
            <p className="text-xs text-amber-700 mt-1 font-medium">Click for details</p>
          </div>

          <div 
            onClick={() => setExpandedMetric(expandedMetric === 'alerts' ? null : 'alerts')}
            className="p-3.5 rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] flex flex-col justify-between cursor-pointer hover:shadow-xs transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-900">Operatory Alerts</span>
              </div>
              <span className="text-2xl font-black text-rose-900 tabular-nums">
                {branchAssets.filter((a: any) => a.status === 'FAULTED').length}
              </span>
            </div>
            <p className="text-xs text-rose-700 mt-1 font-medium">Click for details</p>
          </div>
        </div>

        {/* Dynamic Accordion Progressive Disclosure Drawer */}
        {expandedMetric && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs animate-[fadeSlideDown_0.25s_ease-out]">
            {expandedMetric === 'waiting' && (
              <div>
                <span className="font-bold text-emerald-900 block mb-1.5">Patients in Lounge:</span>
                {activeWaitingQueue.length === 0 ? (
                  <p className="text-slate-500 italic">No patients waiting currently.</p>
                ) : (
                  <ul className="space-y-1">
                    {activeWaitingQueue.map((entry) => (
                      <li key={entry.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                        <span className="font-semibold text-slate-800">{entry.patient.fullName} (#{entry.queueNumber})</span>
                        <span className="text-slate-500 font-mono text-xs">{entry.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {expandedMetric === 'intakes' && (
              <div>
                <span className="font-bold text-amber-900 block mb-1.5">Intakes Awaiting Review:</span>
                {pendingIntakes.length === 0 ? (
                  <p className="text-slate-500 italic">All intakes reviewed.</p>
                ) : (
                  <ul className="space-y-1">
                    {pendingIntakes.map((sub: any) => (
                      <li key={sub.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                        <span className="font-semibold text-slate-800">{sub.patient?.fullName}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(sub, sub.patient)}
                          className="px-2 py-0.5 rounded bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
                        >
                          Review Now
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {expandedMetric === 'alerts' && (
              <div>
                <span className="font-bold text-rose-900 block mb-1.5">Operatory Equipment Alerts:</span>
                {branchAssets.filter((a: any) => a.status === 'FAULTED').length === 0 ? (
                  <p className="text-emerald-700 font-medium">✓ All equipment operational.</p>
                ) : (
                  <ul className="space-y-1">
                    {branchAssets.filter((a: any) => a.status === 'FAULTED').map((asset: any) => (
                      <li key={asset.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                        <span className="font-semibold text-rose-900">{asset.name} ({asset.category})</span>
                        <span className="text-xs font-bold text-rose-700 uppercase">FAULT REPORTED</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

            {actionToast && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#18794E] text-xs font-semibold flex items-center justify-between">
          <span>{actionToast}</span>
          <button type="button" onClick={() => setActionToast(null)} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 3-COLUMN LIVE CLINICAL WORKBENCH (Waiting for Me | Selected Visit & Odontogram | Action Checklist) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (~300px / 3 cols): Waiting for Me + Assigned Patient Roster */}
        <div className="lg:col-span-3 space-y-4">
          {/* Waiting for Me Queue */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#18794E]" />
                <span>Waiting for Me</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#18794E] text-xs font-bold font-mono">
                {activeWaitingQueue.length} Here
              </span>
            </div>

            {activeWaitingQueue.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-800">Queue clear</p>
                <p className="text-xs text-slate-500">
                  Next: {todayAppointments[0]?.patient?.fullName || 'None'} • {todayAppointments[0]?.startTime || 'None'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeWaitingQueue.map((entry) => {
                  const minutesWaiting = Math.max(
                    1,
                    Math.floor((Date.now() - new Date(entry.enteredAt).getTime()) / 60000)
                  );
                  return (
                    <div
                      key={entry.id}
                      onClick={() => {
                        const matched = patients.find((p) => p.id === entry.patient.id) || entry.patient;
                        setSelectedPatient(matched);
                        setSelectedSubmission(matched.medicalSubmissions?.[0] || null);
                      }}
                      className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{entry.patient.fullName}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white text-[#18794E] font-mono text-xs font-bold">
                          #{entry.queueNumber} • {minutesWaiting}m
                        </span>
                      </div>
                      <ClinicalPriorityControl id={entry.id} priority={!!entry.clinicalPriority}/>
                      <div className="flex items-center gap-1.5 pt-1">
                        {entry.status === 'WAITING' && (
                          <button
                            type="button"
                            disabled={callingId === entry.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTransitionQueue(entry.id, 'CALLED');
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-[#176C5B] hover:bg-[#125648] text-white font-bold text-xs"
                          >
                            Call Patient
                          </button>
                        )}
                        {entry.status === 'CALLED' && (
                          <button
                            type="button"
                            disabled={callingId === entry.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTransitionQueue(entry.id, 'IN_CONSULTATION');
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-[#18794E] text-white font-bold text-xs"
                          >
                            Start Exam
                          </button>
                        )}
                        {entry.status === 'IN_CONSULTATION' && (
                          <button
                            type="button"
                            disabled={callingId === entry.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTransitionQueue(entry.id, 'COMPLETED');
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs"
                          >
                            Complete Visit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assigned Patient Roster */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Assigned Patient Roster
              </h3>
              <span className="text-xs font-mono text-slate-500">{patients.length} patients</span>
            </div>

            <div className="space-y-2">
              {patients.map((p) => {
                const latestSub = p.medicalSubmissions?.[0];
                const isSelected = selectedPatient?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPatient(p);
                      setSelectedSubmission(latestSub || null);
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#176C5B]/8 border-[#176C5B] shadow-2xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{p.fullName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          latestSub?.status === 'REVIEWED'
                            ? 'bg-emerald-50 text-[#18794E]'
                            : latestSub?.status === 'PENDING_REVIEW'
                            ? 'bg-amber-50 text-[#946200]'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {latestSub ? `v${latestSub.versionNumber} ${latestSub.status}` : 'NO INTAKE'}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-slate-500 flex items-center justify-between">
                      <span>{p.patientNumber}</span>
                      <span>DOB: {formatDate(p.dateOfBirth)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN (~600px / 6 cols): Active Patient Safety Banner, Interactive FDI Odontogram Preview & Intake Inspector */}
        <div className="lg:col-span-6 space-y-4">
          {selectedPatient ? (
            <>
              {/* 1. Patient Header & Verified Arrival Status */}
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#163447] text-white font-extrabold flex items-center justify-center text-lg shrink-0 shadow-xs">
                      {selectedPatient.fullName
                        .split(' ')
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          {selectedPatient.fullName}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedPatient.gender === 'FEMALE' ? 'Female' : selectedPatient.gender === 'MALE' ? 'Male' : 'Patient'} •{' '}
                        <span className="font-mono font-bold text-[#176C5B]">{selectedPatient.patientNumber}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#18794E] border border-emerald-200 inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#18794E] animate-pulse"></span>
                      Assigned patient
                    </span>
                    <Link
                      href={`/dentist/chart/${selectedPatient.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#176C5B] hover:bg-[#125648] text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Open EDR</span>
                    </Link>
                  </div>
                </div>

                {/* Safety: intake status only. Never synthesize allergies or prescribe from demo text. */}
                <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs border ${
                  hasPendingIntake 
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                    : hasReviewedIntake 
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${hasPendingIntake ? 'text-amber-600' : hasReviewedIntake ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <div className="flex-1">
                    <strong className="block font-bold">
                      {hasPendingIntake ? 'Medical intake pending clinician review' : hasReviewedIntake ? 'Reviewed intake is available' : 'Medical intake not verified'}
                    </strong>
                    <p className="text-slate-600 mt-0.5">
                      {hasPendingIntake ? 'Review the latest submission before making clinical decisions.' : hasReviewedIntake ? 'Inspect the signed clinical intake for allergies and precautions. This overview does not replace the patient record.' : 'Open the patient chart to confirm medical history and allergy status before treatment.'}
                    </p>
                  </div>
                  {selectedPatient && (
                    <Link
                      href={`/dentist/chart/${selectedPatient.id}`}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-xs text-[#0F827B] hover:bg-slate-50 shrink-0 shadow-2xs"
                    >
                      Review chart →
                    </Link>
                  )}
                </div>

                {/* 3. Interactive FDI Two-Digit Odontogram Visual Component */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#176C5B]" />
                      <span className="text-xs font-bold text-slate-900">
                        Interactive FDI Odontogram Overview
                      </span>
                    </div>
                    <Link
                      href={`/dentist/chart/${selectedPatient.id}`}
                      className="text-xs font-bold text-[#176C5B] hover:underline"
                    >
                      Full Charting →
                    </Link>
                  </div>

                  {/* Upper Arch */}
                  <div>
                    <span className="text-xs font-mono uppercase text-slate-400 font-bold block mb-1">
                      Maxillary (Upper Arch)
                    </span>
                    <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                      {FDI_UPPER_ARCH.map((tooth) => {
                        const hasFinding = patientFindings.some((f: any) => f.toothNumber === tooth);
                        const isActive = selectedTooth === tooth;
                        return (
                          <button
                            key={tooth}
                            type="button"
                            onClick={() => setSelectedTooth(tooth)}
                            className={`v2-tooth-button py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
                              isActive
                                ? 'bg-[#176C5B] text-white border-[#176C5B] shadow-2xs scale-105'
                                : hasFinding
                                ? 'bg-amber-100 text-[#946200] border-amber-300'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-[#176C5B]'
                            }`}
                          >
                            <svg className="v2-tooth-outline" width="20" height="27" viewBox="0 0 22 30" fill="none" aria-hidden="true"><path d="M4 3C7 1.5 8.5 3.6 11 3.8C14 3.6 15 1.4 18 3C22 5 20 13 17 19L15 26C14 29 11.8 28.8 11 25C10.2 28.8 8 29 7 26L5 19C2 13 0 5 4 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                            <span>{tooth}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lower Arch */}
                  <div>
                    <span className="text-xs font-mono uppercase text-slate-400 font-bold block mb-1">
                      Mandibular (Lower Arch)
                    </span>
                    <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                      {FDI_LOWER_ARCH.map((tooth) => {
                        const hasFinding = patientFindings.some((f: any) => f.toothNumber === tooth);
                        const isActive = selectedTooth === tooth;
                        return (
                          <button
                            key={tooth}
                            type="button"
                            onClick={() => setSelectedTooth(tooth)}
                            className={`v2-tooth-button py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
                              isActive
                                ? 'bg-[#176C5B] text-white border-[#176C5B] shadow-2xs scale-105'
                                : hasFinding
                                ? 'bg-amber-100 text-[#946200] border-amber-300'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-[#176C5B]'
                            }`}
                          >
                            <svg className="v2-tooth-outline" width="20" height="27" viewBox="0 0 22 30" fill="none" aria-hidden="true"><path d="M4 3C7 1.5 8.5 3.6 11 3.8C14 3.6 15 1.4 18 3C22 5 20 13 17 19L15 26C14 29 11.8 28.8 11 25C10.2 28.8 8 29 7 26L5 19C2 13 0 5 4 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                            <span>{tooth}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Tooth Quick Summary Bar */}
                  <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900">Tooth #{selectedTooth}: </span>
                      <span className="text-slate-600 font-medium">
                        {patientFindings.find((f: any) => f.toothNumber === selectedTooth)?.condition ||
                          'No finding charted for this tooth — review full patient chart'}
                      </span>
                    </div>
                    <Link
                      href={`/dentist/chart/${selectedPatient.id}`}
                      className="text-xs font-bold text-[#176C5B] hover:underline shrink-0 ml-2"
                    >
                      Chart #{selectedTooth} →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Source-driven clinical panel: only recorded status and links, no illustrative diagnoses. */}
              <div className="v2-clinical-lower">
                <div className="v2-clinical-mini">
                  <div className="v2-mini-heading"><Heart size={18}/> Medical context</div>
                  <span className="v2-mini-status">{selectedSubmission?.status || 'Not submitted'}</span>
                  <h3>Review health information</h3>
                  <p>Inspect allergies & precautions.</p>
                  <Link href={`/dentist/chart/${selectedPatient.id}`}>Open intake history <ChevronRight size={15}/></Link>
                </div>
                <div className="v2-clinical-mini">
                  <div className="v2-mini-heading"><FileText size={18}/> Encounter notes</div>
                  <span className="v2-mini-status">Patient chart</span>
                  <h3>Record clinical encounter</h3>
                  <p>Document findings & treatment.</p>
                  <Link href={`/dentist/chart/${selectedPatient.id}`}>Continue documentation <ChevronRight size={15}/></Link>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* RIGHT COLUMN (~280px / 3 cols): Chairside Action Checklist & Pending Intake Reviews */}
        <div className="lg:col-span-3 space-y-4">
          {/* Chairside Clinical Checklist */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#176C5B]" />
                <span>Visit Action Checklist</span>
              </h3>
              <span className="text-xs font-bold text-[#176C5B] font-mono">Review required</span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#176C5B] h-2 rounded-full w-0 transition-all"></div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Review steps in patient chart</span>
                <span>Active Encounter</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { label: 'Review and confirm medical intake', done: !!hasReviewedIntake },
                { label: 'Document examination findings', done: false },
                { label: 'Update FDI tooth chart', done: false },
                { label: 'Review treatment plan', done: false },
                { label: 'Sign encounter note', done: false },
              ].map((task, idx) => (
                <div key={task.label} className="v2-clinical-task">
                  <span className={task.done ? 'v2-task-done' : 'v2-task-open'}>{task.done ? <CheckCircle2 size={16}/> : String(idx + 1).padStart(2,'0')}</span>
                  <span>{task.label}</span>
                  <span className="v2-task-state">{task.done ? 'Reviewed' : 'Check chart'}</span>
                </div>
              ))}
              {selectedPatient && <Link href={`/dentist/chart/${selectedPatient.id}`} className="v2-task-open-chart">Open full clinical workspace <ChevronRight size={16}/></Link>}
            </div>
          </div>

          {/* Pending Intake Sign-Off Queue */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Pending Intake Reviews
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#176C5B] text-xs font-bold">
                {pendingIntakes.length}
              </span>
            </div>

            {pendingIntakes.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">All patient intakes signed off.</p>
            ) : (
              <div className="space-y-2.5">
                {pendingIntakes.map((intake) => (
                  <div
                    key={intake.id}
                    className="p-3 rounded-xl bg-[#EAF3FF]/40 border border-[#176C5B]/20 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{intake.patient.fullName}</span>
                      <span className="px-1.5 py-0.5 bg-[#EAF3FF] text-[#176C5B] font-mono text-xs font-bold rounded">
                        v{intake.versionNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(intake.patient);
                          setSelectedSubmission(intake);
                        }}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-lg font-bold text-xs"
                      >
                        Inspect Answers
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReview(intake, intake.patient)}
                        className="flex-1 py-1.5 px-2 bg-[#18794E] hover:bg-emerald-800 text-white rounded-lg font-bold text-xs"
                      >
                        Sign Off
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: CLINICIAN INTAKE REVIEW SIGN-OFF */}
      {isReviewOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Clinician Review Sign-Off (Version {selectedSubmission.versionNumber})
            </h3>
            <p className="text-xs text-slate-500">
              Patient: <strong className="text-slate-800">{selectedPatient?.fullName}</strong> ({selectedPatient?.patientNumber})
            </p>

            {reviewSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-[#18794E] text-xs rounded-xl font-bold">
                {reviewSuccess}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewOutcome('APPROVED')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    reviewOutcome === 'APPROVED'
                      ? 'bg-[#18794E] text-white border-[#18794E]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  ✓ Approve as Reviewed
                </button>
                <button
                  type="button"
                  onClick={() => setReviewOutcome('CLARIFICATION_REQUESTED')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    reviewOutcome === 'CLARIFICATION_REQUESTED'
                      ? 'bg-[#946200] text-white border-[#946200]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  ⚠ Request Clarification
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinician Notes &amp; Directives *
                </label>
                <textarea
                  rows={3}
                  required
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Record allergy precautions..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="px-5 py-2 bg-[#18794E] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                >
                  {reviewLoading ? 'Saving...' : 'Save Clinical Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONTEXTUAL OPERATORY EQUIPMENT ISSUE REPORT */}
      {showFaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Report Operatory Fault</h3>
              <button
                type="button"
                onClick={() => setShowFaultModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitEquipmentFault} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Operatory Asset</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {branchAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.serialNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Impact Severity</label>
                <select
                  value={faultSeverity}
                  onChange={(e) => setFaultSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="MINOR">Minor</option>
                  <option value="MAJOR">Major</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fault Description *</label>
                <textarea
                  rows={3}
                  required
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  placeholder="Describe observed symptom..."
                  className="w-full p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFaultModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={faultSaving}
                  className="px-4 py-2 rounded-xl bg-[#946200] hover:bg-amber-900 text-white font-bold"
                >
                  {faultSaving ? 'Submitting...' : 'Submit Fault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
