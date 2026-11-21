'use client';

import { LocalizedDate } from '@/components/LocalizedDate';
import { LocalizedTextarea } from '@/components/LocalizedControls';
import { TranslatedText } from '@/components/TranslatedText';
import { FrostedSlideOverDrawer } from '@/components/ui/FrostedSlideOverDrawer';
import { PillToggleSwitch } from '@/components/ui/VisualSubPageCanvas';
import { AnatomicalExamChart } from '@/components/phase1/AnatomicalExamChart';
import { CbctAnd3DViewer } from '@/components/phase1/CbctAnd3DViewer';
import LabManagementPhaseTwo from '@/components/phase2/LabManagementPhaseTwo';
import FinanceCenterPhaseTwo from '@/components/phase2/FinanceCenterPhaseTwo';
import InventorySuppliesPhaseTwo from '@/components/phase2/InventorySuppliesPhaseTwo';
import InboxWhatsAppPhaseThree from '@/components/phase3/InboxWhatsAppPhaseThree';
import WebsiteReviewsPhaseThree from '@/components/phase3/WebsiteReviewsPhaseThree';
import AttendancePayrollPhaseThree from '@/components/phase3/AttendancePayrollPhaseThree';
import StatisticsAndReportsPhaseThree from '@/components/phase3/StatisticsAndReportsPhaseThree';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Activity,
  Wrench,
  X,
  FileText,
  ChevronRight,
  ZoomIn,
  Sun,
  Scan,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  currentUser: any;
  assignedPatients: any[];
  waitingQueue?: any[];
  todayAppointments?: any[];
  branchAssets?: any[];
}

export function DentistDeskClient({
  currentUser,
  assignedPatients: initialPatients,
  waitingQueue = [],
  branchAssets = [],
}: Props) {
  const router = useRouter();
  const [patients] = useState(initialPatients);
  const [queue, setQueue] = useState(waitingQueue);

  useEffect(() => {
    let active = true;
    const sync = () =>
      fetch('/api/scheduling/queue')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (active && data) setQueue(data.queue);
        })
        .catch(() => {});
    sync();
    const timer = setInterval(sync, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => setQueue(waitingQueue), [waitingQueue]);

  const [selectedPatient, setSelectedPatient] = useState<any | null>(initialPatients[0] || null);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(
    initialPatients[0]?.medicalSubmissions?.[0] || null
  );
  const [selectedArchTooth, setSelectedArchTooth] = useState<string>('36');
  const [xrayZoom, setXrayZoom] = useState<number>(115);
  const [xrayBrightness, setXrayBrightness] = useState<number>(110);

  // Pill Toggle Switch states in the Clinical Inspector
  const [toggleChecks, setToggleChecks] = useState({
    allergy: true,
    conditions: false,
    history: false,
    diagnostics: true,
    vitals: false,
  });

  const [callingId, setCallingId] = useState<string | null>(null);

  // Review Drawer State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewOutcome, setReviewOutcome] = useState<'APPROVED' | 'CLARIFICATION_REQUESTED'>('APPROVED');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Equipment Fault Drawer State
  const [showFaultModal, setShowFaultModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(branchAssets[0]?.id || '');
  const [faultSeverity, setFaultSeverity] = useState<'CRITICAL' | 'MAJOR' | 'MINOR'>('MAJOR');
  const [faultDescription, setFaultDescription] = useState('');
  const [faultSaving, setFaultSaving] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

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
        body: JSON.stringify({
          action:
            ({ IN_CONSULTATION: 'START', COMPLETED: 'COMPLETE' } as Record<string, string>)[
              targetStatus
            ] || targetStatus,
        }),
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

  const activeWaitingQueue = queue.filter((q) => ['CALLED', 'IN_CONSULTATION'].includes(q.status));

  // Curved 32-Tooth Glowing Odontogram Coordinates (Upper & Lower Arches matching Reference Image 3)
  const upperArchTeeth = [
    { id: '18', x: 52, y: 185, tone: 'cyan' },
    { id: '17', x: 55, y: 150, tone: 'coral' },
    { id: '16', x: 64, y: 116, tone: 'cyan' },
    { id: '15', x: 78, y: 86, tone: 'cyan' },
    { id: '14', x: 96, y: 62, tone: 'cyan' },
    { id: '13', x: 118, y: 44, tone: 'cyan' },
    { id: '12', x: 144, y: 33, tone: 'amber' },
    { id: '11', x: 172, y: 28, tone: 'amber' },
    { id: '21', x: 202, y: 28, tone: 'amber' },
    { id: '22', x: 230, y: 33, tone: 'amber' },
    { id: '23', x: 256, y: 44, tone: 'amber' },
    { id: '24', x: 278, y: 62, tone: 'amber' },
    { id: '25', x: 296, y: 86, tone: 'cyan' },
    { id: '26', x: 310, y: 116, tone: 'cyan' },
    { id: '27', x: 319, y: 150, tone: 'cyan' },
    { id: '28', x: 322, y: 185, tone: 'cyan' },
  ];

  const lowerArchTeeth = [
    { id: '48', x: 56, y: 255, tone: 'cyan' },
    { id: '47', x: 60, y: 290, tone: 'cyan' },
    { id: '46', x: 70, y: 324, tone: 'cyan' },
    { id: '45', x: 86, y: 354, tone: 'amber' },
    { id: '44', x: 106, y: 378, tone: 'amber' },
    { id: '43', x: 130, y: 396, tone: 'amber' },
    { id: '42', x: 156, y: 407, tone: 'coral' },
    { id: '41', x: 184, y: 410, tone: 'amber' },
    { id: '31', x: 212, y: 407, tone: 'cyan' },
    { id: '32', x: 238, y: 396, tone: 'cyan' },
    { id: '33', x: 262, y: 378, tone: 'amber' },
    { id: '34', x: 282, y: 354, tone: 'amber' },
    { id: '35', x: 298, y: 324, tone: 'amber' },
    { id: '36', x: 308, y: 290, tone: 'coral' },
    { id: '37', x: 312, y: 255, tone: 'cyan' },
    { id: '38', x: 314, y: 225, tone: 'cyan' },
  ];

  const getToothPalette = (tone: string, isSelected: boolean) => {
    if (isSelected) {
      return { fill: '#14B8A6', stroke: '#FFFFFF', glow: 'drop-shadow(0 0 12px rgba(20,184,166,0.9))' };
    }
    if (tone === 'coral') {
      return { fill: 'rgba(244,63,94,0.45)', stroke: '#FB7185', glow: 'drop-shadow(0 0 8px rgba(244,63,94,0.55))' };
    }
    if (tone === 'amber') {
      return { fill: 'rgba(245,158,11,0.38)', stroke: '#FBBF24', glow: 'drop-shadow(0 0 6px rgba(245,158,11,0.4))' };
    }
    return { fill: 'rgba(20,184,166,0.38)', stroke: '#2DD4BF', glow: 'drop-shadow(0 0 8px rgba(20,184,166,0.45))' };
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto px-3 sm:px-6 py-4 space-y-5 text-slate-100">
      {actionToast && (
        <div className="px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>{actionToast}</span>
          <button type="button" onClick={() => setActionToast(null)} className="hover:underline">
            <TranslatedText text="Dismiss" />
          </button>
        </div>
      )}

      {/* ====================================================================
          CHAIRSIDE CLINICAL DARK COCKPIT (Matching Reference Image 3)
          - Left: Vertical Patient Avatar Queue Dock with glowing rings
          - Center: Interactive 32-Tooth Glowing Odontogram + Panoramic X-Ray Lightbox
          - Right: Frosted Dark Clinical Inspector & Sign-Off Panel
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[760px]">
        {/* 1. LEFT DOCK + SPLIT CENTER STAGE (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col sm:flex-row gap-4">
          {/* Left Vertical Patient Avatar Queue Dock */}
          <div className="flex sm:flex-col items-center gap-3 p-2.5 rounded-3xl bg-slate-900/90 border border-slate-800/90 overflow-x-auto sm:overflow-y-auto shrink-0">
            {patients.map((p, idx) => {
              const isSelected = selectedPatient?.id === p.id;
              const initials = p.fullName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2);
              const latestSub = p.medicalSubmissions?.[0];
              const hasActiveRing = isSelected || idx < 2 || latestSub?.status === 'PENDING_REVIEW';
              return (
                <button
                  key={p.id}
                  type="button"
                  title={`${p.fullName} (${p.patientNumber})`}
                  onClick={() => {
                    setSelectedPatient(p);
                    setSelectedSubmission(latestSub || null);
                  }}
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-xs transition-all active:scale-95 shrink-0 ${
                    isSelected
                      ? 'bg-[#14B8A6] text-slate-950 ring-4 ring-[#14B8A6]/45 shadow-[0_0_20px_rgba(20,184,166,0.75)] scale-105'
                      : hasActiveRing
                      ? 'bg-slate-800 text-[#14B8A6] ring-2 ring-[#14B8A6]'
                      : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-[#14B8A6]'
                  }`}
                >
                  <span>{initials}</span>
                  <span className="sr-only">{p.fullName}</span>
                </button>
              );
            })}
          </div>

          {/* Center Split Stage: Glowing 32-Tooth Odontogram + Panoramic X-Ray Lightbox */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 items-center bg-gradient-to-b from-[#0E1626] to-[#090D16] rounded-3xl border border-slate-800/90 p-5 shadow-2xl">
            {/* Left Half of Center Stage: Interactive 32-Tooth Glowing Odontogram */}
            <div className="xl:col-span-6 flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between mb-2 px-2">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#14B8A6] block">
                    <TranslatedText text="CLINICAL WORKSPACE &amp; CHAIRSIDE OPERATORY" />
                  </span>
                  <h2 className="text-base font-extrabold text-white">
                    {currentUser.fullName} · Tooth #{selectedArchTooth}
                  </h2>
                </div>
                {selectedPatient && (
                  <Link
                    href={`/dentist/chart/${selectedPatient.id}?tab=chart`}
                    className="px-3 py-1.5 rounded-full bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 text-[#14B8A6] border border-[#14B8A6]/30 text-xs font-bold transition-all"
                  >
                    <TranslatedText text="Open EDR" /> →
                  </Link>
                )}
              </div>

              <svg
                viewBox="0 0 374 440"
                className="w-full max-w-[340px] select-none"
                role="img"
                aria-label="Interactive 32-Tooth Glowing Odontogram"
              >
                {/* Translucent Upper Arch Alveolar Rim */}
                <path
                  d="M 38 195 C 38 75, 100 12, 187 12 C 274 12, 336 75, 336 195 C 316 195, 296 195, 290 175 C 280 95, 240 58, 187 58 C 134 58, 94 95, 84 175 C 78 195, 58 195, 38 195 Z"
                  fill="rgba(148, 163, 184, 0.12)"
                  stroke="rgba(148, 163, 184, 0.28)"
                  strokeWidth="2"
                />

                {/* Translucent Lower Arch Alveolar Rim */}
                <path
                  d="M 42 230 C 42 355, 104 426, 187 426 C 270 426, 332 355, 332 230 C 312 230, 294 230, 286 250 C 274 335, 236 376, 187 376 C 138 376, 100 335, 88 250 C 80 230, 62 230, 42 230 Z"
                  fill="rgba(148, 163, 184, 0.12)"
                  stroke="rgba(148, 163, 184, 0.28)"
                  strokeWidth="2"
                />

                {/* Render 16 Upper Teeth */}
                {upperArchTeeth.map((t) => {
                  const isPicked = selectedArchTooth === t.id;
                  const pal = getToothPalette(t.tone, isPicked);
                  return (
                    <g
                      key={t.id}
                      onClick={() => setSelectedArchTooth(t.id)}
                      className="cursor-pointer transition-transform hover:scale-110"
                      style={{ filter: pal.glow }}
                    >
                      <circle
                        cx={t.x}
                        cy={t.y}
                        r={isPicked ? 15 : 13}
                        fill={pal.fill}
                        stroke={pal.stroke}
                        strokeWidth={isPicked ? 2.5 : 1.5}
                      />
                      {t.tone === 'coral' && (
                        <circle cx={t.x} cy={t.y} r="4.5" fill="#1E1B4B" />
                      )}
                      <text
                        x={t.x}
                        y={t.y + 3.5}
                        textAnchor="middle"
                        className="fill-white font-mono text-[8px] font-extrabold pointer-events-none"
                      >
                        {t.id}
                      </text>
                    </g>
                  );
                })}

                {/* Render 16 Lower Teeth */}
                {lowerArchTeeth.map((t) => {
                  const isPicked = selectedArchTooth === t.id;
                  const pal = getToothPalette(t.tone, isPicked);
                  return (
                    <g
                      key={t.id}
                      onClick={() => setSelectedArchTooth(t.id)}
                      className="cursor-pointer transition-transform hover:scale-110"
                      style={{ filter: pal.glow }}
                    >
                      <circle
                        cx={t.x}
                        cy={t.y}
                        r={isPicked ? 15 : 13}
                        fill={pal.fill}
                        stroke={pal.stroke}
                        strokeWidth={isPicked ? 2.5 : 1.5}
                      />
                      {t.tone === 'coral' && (
                        <circle cx={t.x} cy={t.y} r="4.5" fill="#1E1B4B" />
                      )}
                      <text
                        x={t.x}
                        y={t.y + 3.5}
                        textAnchor="middle"
                        className="fill-white font-mono text-[8px] font-extrabold pointer-events-none"
                      >
                        {t.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Right Half of Center Stage: Panoramic X-Ray Lightbox with Zoom & Brightness Sliders */}
            <div className="xl:col-span-6 space-y-4">
              <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-white">
                    Panoramic X-ray lightbox
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {selectedPatient && (
                      <Link
                        href={`/dentist/chart/${selectedPatient.id}`}
                        className="px-3 py-1 rounded-full bg-[#14B8A6]/20 hover:bg-[#14B8A6]/30 text-[#14B8A6] border border-[#14B8A6]/40 text-xs font-extrabold transition-all"
                      >
                        + Assign tooth #{selectedArchTooth}
                      </Link>
                    )}
                  </div>
                </div>

                {/* High-Contrast Panoramic Radiograph Viewport */}
                <div className="relative h-56 rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
                  <img
                    src="/images/hero_implant_2.jpg"
                    alt="Panoramic Dental X-Ray"
                    style={{
                      transform: `scale(${xrayZoom / 100})`,
                      filter: `grayscale(100%) contrast(145%) brightness(${xrayBrightness}%)`,
                      transition: 'transform 0.2s ease-out, filter 0.2s ease-out',
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2.5 start-3 px-2.5 py-1 rounded-full bg-slate-950/85 border border-slate-700 text-[10px] font-mono text-[#14B8A6]">
                    Tooth #{selectedArchTooth} · Zoom {xrayZoom}% · Brightness {xrayBrightness}%
                  </div>
                </div>

                {/* Interactive Zoom & Brightness Sliders matching Reference Image 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5 text-[#14B8A6]" />
                        <span>Zoom</span>
                      </span>
                      <span className="font-mono text-[#14B8A6] tabular-nums">{xrayZoom}%</span>
                    </div>
                    <input
                      type="range"
                      min={85}
                      max={180}
                      value={xrayZoom}
                      onChange={(e) => setXrayZoom(Number(e.target.value))}
                      className="w-full accent-[#14B8A6] cursor-pointer h-1.5 rounded-lg bg-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-[#14B8A6]" />
                        <span>Brightness</span>
                      </span>
                      <span className="font-mono text-[#14B8A6] tabular-nums">{xrayBrightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={70}
                      max={160}
                      value={xrayBrightness}
                      onChange={(e) => setXrayBrightness(Number(e.target.value))}
                      className="w-full accent-[#14B8A6] cursor-pointer h-1.5 rounded-lg bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Operational Controls Bar */}
              <div className="grid grid-cols-2 gap-3">
                {selectedPatient && (
                  <Link
                    href={`/dentist/chart/${selectedPatient.id}`}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-extrabold text-white transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-[#14B8A6]" />
                      <span>
                        <TranslatedText text="Open Chart (" />
                        {selectedPatient.fullName?.split(' ')[0]})
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#14B8A6]" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setShowFaultModal(true)}
                  className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-extrabold text-amber-300 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>
                      <TranslatedText text="Report Issue" />
                    </span>
                  </span>
                  <span className="font-mono text-[10px]">
                    {branchAssets.filter((a: any) => a.status === 'FAULTED').length} alerts
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. RIGHT DARK FROSTED SLIDE-OVER INSPECTOR PANEL (lg:col-span-4) */}
        <aside className="lg:col-span-4 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-2xl space-y-5">
          {selectedPatient ? (
            <>
              <div className="space-y-5">
                {/* Patient Identity Header */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-[#14B8A6] font-extrabold text-base flex items-center justify-center shrink-0">
                      {selectedPatient.fullName
                        .split(' ')
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-white tracking-tight">
                        {selectedPatient.fullName}
                      </h2>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        {selectedPatient.patientNumber} ·{' '}
                        <LocalizedDate value={selectedPatient.dateOfBirth} time={false} />
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dentist/chart/${selectedPatient.id}`}
                    className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-[#14B8A6]"
                  >
                    EDR →
                  </Link>
                </div>

                {/* Medical Alert 4-Icon Badge Grid matching Reference Image 3 */}
                <div className="space-y-2.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                    Medical alert
                  </span>
                  <div className="grid grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-2xl bg-rose-950/60 border-2 border-rose-500/80 text-rose-300 flex flex-col items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(244,63,94,0.28)]">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span className="text-[11px] font-extrabold">Allergy</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-amber-300 flex flex-col items-center justify-center gap-1.5">
                      <Heart className="w-5 h-5 text-amber-400" />
                      <span className="text-[11px] font-bold">Vitals</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[#14B8A6] flex flex-col items-center justify-center gap-1.5">
                      <Activity className="w-5 h-5 text-[#14B8A6]" />
                      <span className="text-[11px] font-bold">Vitals</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[#14B8A6] flex flex-col items-center justify-center gap-1.5">
                      <Scan className="w-5 h-5 text-[#14B8A6]" />
                      <span className="text-[11px] font-bold">Sensor</span>
                    </div>
                  </div>

                  {/* Telemetry Waveform & Sensor Strip */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-end gap-1 h-7">
                        {[35, 65, 45, 90, 60, 80, 50, 95].map((h, i) => (
                          <span
                            key={i}
                            style={{ height: `${h}%` }}
                            className="w-1 rounded-full bg-[#14B8A6]"
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-[#14B8A6] font-bold">98%</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">GPN</span>
                        <span className="text-white font-bold">100m</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="w-3/4 h-full rounded-full bg-[#14B8A6]" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Sensor</span>
                        <span className="text-white">69</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditions / Intake Review Checklist with Glowing Cyan Pill Toggle Switches */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                    Conditions &amp; Intake Verification
                  </span>
                  <div className="space-y-2">
                    <PillToggleSwitch
                      dark
                      checked={toggleChecks.allergy}
                      onChange={(v) => setToggleChecks({ ...toggleChecks, allergy: v })}
                      label="Allergy history verified"
                      icon={<Activity className="w-4 h-4" />}
                    />
                    <PillToggleSwitch
                      dark
                      checked={toggleChecks.conditions}
                      onChange={(v) => setToggleChecks({ ...toggleChecks, conditions: v })}
                      label="Systemic conditions checked"
                      icon={<Heart className="w-4 h-4" />}
                    />
                    <PillToggleSwitch
                      dark
                      checked={toggleChecks.history}
                      onChange={(v) => setToggleChecks({ ...toggleChecks, history: v })}
                      label="Prior dental history reviewed"
                      icon={<FileText className="w-4 h-4" />}
                    />
                    <PillToggleSwitch
                      dark
                      checked={toggleChecks.diagnostics}
                      onChange={(v) => setToggleChecks({ ...toggleChecks, diagnostics: v })}
                      label="Radiographic diagnostics linked"
                      icon={<Scan className="w-4 h-4" />}
                    />
                    <PillToggleSwitch
                      dark
                      checked={toggleChecks.vitals}
                      onChange={(v) => setToggleChecks({ ...toggleChecks, vitals: v })}
                      label="Pre-operative vitals cleared"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    />
                  </div>
                </div>

                {/* Active Queue Consultation Controls */}
                {queue
                  .filter(
                    (entry) =>
                      entry.patientId === selectedPatient.id &&
                      ['CALLED', 'IN_CONSULTATION'].includes(entry.status)
                  )
                  .map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      disabled={callingId === entry.id}
                      onClick={() =>
                        handleTransitionQueue(
                          entry.id,
                          entry.status === 'CALLED' ? 'IN_CONSULTATION' : 'COMPLETED'
                        )
                      }
                      className="w-full py-2.5 px-4 rounded-full bg-slate-800 hover:bg-slate-700 border border-[#14B8A6]/40 text-[#14B8A6] text-xs font-extrabold transition-all active:scale-95"
                    >
                      <TranslatedText
                        text={
                          entry.status === 'CALLED' ? 'Start consultation' : 'Finish consultation'
                        }
                      />
                    </button>
                  ))}
              </div>

              {/* Sticky Bottom Glowing Emerald Sign Off Button */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const sub =
                      selectedSubmission ||
                      pendingIntakes[0] ||
                      selectedPatient.medicalSubmissions?.[0];
                    if (sub) {
                      handleOpenReview(sub, selectedPatient);
                    } else {
                      router.push(`/dentist/chart/${selectedPatient.id}?tab=intake`);
                    }
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-sm shadow-[0_0_25px_rgba(16,185,129,0.45)] transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <TranslatedText text="Sign Off" />
                </button>
              </div>
            </>
          ) : null}
        </aside>
      </div>

      {/* ====================================================================
          SLIDE-OVER DRAWERS: Clinician Intake Review & Equipment Fault Report
         ==================================================================== */}
      <FrostedSlideOverDrawer
        open={isReviewOpen && !!selectedSubmission}
        onClose={() => setIsReviewOpen(false)}
        dark
        title={
          <>
            <TranslatedText text="Clinician Review Sign-Off (Version" />{' '}
            {selectedSubmission?.versionNumber})
          </>
        }
        subtitle={`${selectedPatient?.fullName || ''} (${selectedPatient?.patientNumber || ''})`}
        iconBadge={<ShieldAlert className="w-5 h-5" />}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsReviewOpen(false)}
              className="secondary-button"
            >
              <TranslatedText text="Cancel" />
            </button>
            <button
              type="submit"
              form="dentist-review-form"
              disabled={reviewLoading}
              className="primary-button !bg-[#10B981] !text-white !border-[#10B981]"
            >
              <TranslatedText
                text={String(reviewLoading ? 'Saving...' : 'Save Clinical Review')}
              />
            </button>
          </div>
        }
      >
        {reviewSuccess && (
          <div className="p-3.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs rounded-2xl font-bold">
            {reviewSuccess}
          </div>
        )}

        <form id="dentist-review-form" onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReviewOutcome('APPROVED')}
              className={`py-2.5 px-3 rounded-full border text-xs font-extrabold transition-all ${
                reviewOutcome === 'APPROVED'
                  ? 'bg-[#10B981] text-white border-[#10B981]'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <TranslatedText text="✓ Approve as Reviewed" />
            </button>
            <button
              type="button"
              onClick={() => setReviewOutcome('CLARIFICATION_REQUESTED')}
              className={`py-2.5 px-3 rounded-full border text-xs font-extrabold transition-all ${
                reviewOutcome === 'CLARIFICATION_REQUESTED'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <TranslatedText text="⚠ Request Clarification" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              <TranslatedText text="Clinician Notes &amp; Directives *" />
            </label>
            <LocalizedTextarea
              rows={3}
              required
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Record allergy precautions..."
              className="field w-full"
            />
          </div>
        </form>
      </FrostedSlideOverDrawer>

      <FrostedSlideOverDrawer
        open={showFaultModal}
        onClose={() => setShowFaultModal(false)}
        dark
        title={<TranslatedText text="Report Operatory Fault" />}
        subtitle="Log chairside equipment fault for immediate engineering review"
        iconBadge={<Wrench className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowFaultModal(false)}
              className="secondary-button"
            >
              <TranslatedText text="Cancel" />
            </button>
            <button
              type="submit"
              form="dentist-fault-form"
              disabled={faultSaving}
              className="primary-button !bg-amber-500 !text-slate-950 !border-amber-500"
            >
              <TranslatedText text={String(faultSaving ? 'Submitting...' : 'Submit Fault')} />
            </button>
          </div>
        }
      >
        <form id="dentist-fault-form" onSubmit={handleSubmitEquipmentFault} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              <TranslatedText text="Operatory Asset" />
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="field w-full"
            >
              {branchAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.serialNumber})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              <TranslatedText text="Impact Severity" />
            </label>
            <select
              value={faultSeverity}
              onChange={(e) => setFaultSeverity(e.target.value as any)}
              className="field w-full"
            >
              <option value="MINOR">Minor</option>
              <option value="MAJOR">Major</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              <TranslatedText text="Fault Description *" />
            </label>
            <LocalizedTextarea
              rows={3}
              required
              value={faultDescription}
              onChange={(e) => setFaultDescription(e.target.value)}
              placeholder="Describe observed symptom..."
              className="field w-full"
            />
          </div>
        </form>
      </FrostedSlideOverDrawer>
    </div>
  );
}
