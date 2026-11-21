'use client';
import {LocalizedDate} from '@/components/LocalizedDate';

import {LocalizedInput} from '@/components/LocalizedControls';

import {ReceptionBooking} from '@/components/ReceptionBooking';
import {UnifiedPatientFileView} from '@/components/phase1/InstantPatientSearchAndRecord';
import {TranslatedText} from '@/components/TranslatedText';


import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { WorkspaceEmblem } from '@/components/ui/WorkspaceEmblem';
import { StatusTag } from '@/components/ui/StatusTag';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDate } from '../../lib/utils';
import {
  Search,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  FileText,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Calendar,
  CreditCard,
  UserCheck,
  Stethoscope,
  X,
  ArrowUpRight,
  Users,
  Activity,
  Receipt,
  ArrowRightLeft,
} from 'lucide-react';

interface Props {
  currentUser: any;
  pendingLinks: any[];
  duplicateReviews: any[];
  branches: any[];
  initialAppointments?: any[];
  initialPendingRequests?: any[];
  initialDoctorDuties?: any[];
}

type BoardFilter = 'ALL' | 'EXPECTED' | 'HERE' | 'WITH_DOCTOR' | 'CHECKOUT' | 'COMPLETED';

export function ReceptionWorkspaceClient({
  currentUser,
  pendingLinks: initialLinks,
  duplicateReviews: initialDuplicates,
  branches,
  initialAppointments = [],
  initialPendingRequests = [],
  initialDoctorDuties = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = searchParams?.get('view') || 'today';
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Unified board state
  const [boardFilter, setBoardFilter] = useState<BoardFilter>('ALL');
  const [appointments, setAppointments] = useState<any[]>(initialAppointments);
  const [unverifiedArrivals, setUnverifiedArrivals] = useState<any[]>([]);
  const [liveQueue, setLiveQueue] = useState<any[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  // Contextual Patient Side Drawer
  const [drawerPatient, setDrawerPatient] = useState<any | null>(null);

  // Data Reconciliation & Links Drawer / Modal
  const [bookPatient,setBookPatient]=useState<any>(null);
  const [showReconciliationDrawer, setShowReconciliationDrawer] = useState(false);
  const [pendingLinks, setPendingLinks] = useState(initialLinks);
  const [duplicateReviews, setDuplicateReviews] = useState(initialDuplicates);
  const [activeLinkVerification, setActiveLinkVerification] = useState<any | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [idCheckConfirmed, setIdCheckConfirmed] = useState(false);

  // Register Walk-in Modal State (with return-to-task support)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [returnToTaskAfterRegister, setReturnToTaskAfterRegister] = useState<'CHECK_IN' | 'APPOINTMENT' | null>(null);
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    primaryPhone: '',
    nationalIdOrPassport: '',
    address: '',
    primaryBranchId: currentUser?.roleGrants?.[0]?.branchId || branches[0]?.id || '',
    migrationStatus: 'FULLY_DIGITIZED',
    legacyBalanceNotes: '',
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const branchName = currentUser?.roleGrants?.[0]?.branch?.name || branches[0]?.name || 'Branch A - Heliopolis';
  const branchCode = currentUser?.roleGrants?.[0]?.branch?.code || branches[0]?.code || 'BR-A';

  // Keyboard shortcut Ctrl+K or '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setDrawerPatient(null);
        setShowReconciliationDrawer(false);
        setIsRegisterOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchArrivalsAndQueue = async () => {
    try {
      setLoadingBoard(true);
      const currentBranchId = currentUser?.roleGrants?.find((g: any) => g.branchId)?.branchId;
      const scoped = currentBranchId ? `&branchId=${encodeURIComponent(currentBranchId)}` : '';
      const [arrRes, qRes] = await Promise.all([
        fetch(`/api/scheduling/arrivals?unverified=true${scoped}`),
        fetch(`/api/scheduling/queue?${scoped.slice(1)}`),
      ]);
      if (arrRes.ok) {
        const arrData = await arrRes.json();
        setUnverifiedArrivals(arrData.arrivals || []);
      }
      if (qRes.ok) {
        const qData = await qRes.json();
        setLiveQueue(qData.queue || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBoard(false);
    }
  };

  useEffect(() => {
    fetchArrivalsAndQueue();
  }, []);

  // Debounced Patient Search (250ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.results || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Verify Physical Arrival
  const handleVerifyArrival = async (arrivalId: string) => {
    if (busyActionId) return;
    setBusyActionId(arrivalId);
    try {
      const res = await fetch(`/api/scheduling/arrivals/${arrivalId}/verify`, {
        method: 'POST',
      });
      if (res.ok) {
        setActionMessage('Physical presence verified. Patient moved to Waiting Queue.');
        await fetchArrivalsAndQueue();
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Verification failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusyActionId(null);
    }
  };

  // Direct Walk-In / Appointment Check-In from Patient Drawer or Row
  const handleReportAndVerifyArrival = async (patientId: string, appointmentId?: string) => {
    if (busyActionId) return;
    setBusyActionId(patientId);
    try {
      const branchId = currentUser?.roleGrants?.[0]?.branchId || branches[0]?.id;
      const arrRes = await fetch('/api/scheduling/arrivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          patientId,
          appointmentId,
        }),
      });
      const arrData = await arrRes.json();
      if (!arrRes.ok) throw new Error(arrData.error || 'Failed to record arrival');

      setActionMessage("Patient checked in.");
      setDrawerPatient(null);
      await fetchArrivalsAndQueue();
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleQueueTransition = async (queueId: string, targetStatus: string) => {
    if (busyActionId) return;
    setBusyActionId(queueId);
    try {
      const res = await fetch(`/api/scheduling/queue/${queueId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: ({ CALLED: 'CALL', IN_CONSULTATION: 'START', COMPLETED: 'COMPLETE' } as Record<string,string>)[targetStatus] || targetStatus }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Could not update the queue.'); }
      if (res.ok) {
        await fetchArrivalsAndQueue();
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusyActionId(null);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    try {
      const res = await fetch('/api/patients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const createdPatient = data.patient;
      setRegisterSuccess(`Registered ${createdPatient.fullName} (${createdPatient.patientNumber})`);

      setTimeout(() => {
        setIsRegisterOpen(false);
        setRegisterSuccess(null);
        // Automatic return to interrupted check-in or appointment workflow
        if (returnToTaskAfterRegister === 'CHECK_IN') {
          setDrawerPatient(createdPatient);
          setActionMessage(`New patient ${createdPatient.fullName} created. Ready for immediate check-in.`);
        } else {
          setSearchQuery(createdPatient.fullName);
        }
        setReturnToTaskAfterRegister(null);
        router.refresh();
      }, 900);
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleVerifyLink = async (linkId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/patients/verify-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId,
          decision,
          verificationNotes: verificationNotes || 'Physically verified ID at reception desk',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPendingLinks(pendingLinks.filter((l) => l.id !== linkId));
      setActiveLinkVerification(null);
      setVerificationNotes('');
      setIdCheckConfirmed(false);
      setActionMessage(`Portal link ${decision === 'APPROVE' ? 'approved' : 'rejected'}.`);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleResolveDuplicate = async (reviewId: string, resolution: 'REVIEWED_DISTINCT' | 'RESOLVED_MERGED') => {
    try {
      const res = await fetch('/api/patients/resolve-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          resolution,
          resolutionNotes: 'Verified distinct individuals sharing family contact details.',
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setDuplicateReviews(duplicateReviews.filter((d) => d.id !== reviewId));
      setActionMessage('Duplicate candidate pair resolved.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Build unified Today's Appointment & Arrival Board rows
  const unifiedRows = [
    // 1. Unverified self-reported arrivals (Here — Awaiting Presence Check)
    ...unverifiedArrivals.map((arr) => ({
      id: `arr-${arr.id}`,
      rawId: arr.id,
      type: 'UNVERIFIED_ARRIVAL' as const,
      time: new Date(arr.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patient: arr.patient,
      doctorName: arr.appointment?.dentistUser?.fullName || 'Assigned Clinician',
      service: arr.appointment?.serviceDescription || 'Scheduled Consultation',
      stage: 'HERE' as BoardFilter,
      stageLabel: 'Reported Arrival (Verify Presence)',
      stageTone: 'amber',
      waitMinutes: Math.max(1, Math.floor((Date.now() - new Date(arr.reportedAt).getTime()) / 60000)),
    })),
    // 2. Active Queue entries (Verified Waiting / In Treatment / Completed)
    ...liveQueue.map((q) => ({
      id: `q-${q.id}`,
      rawId: q.id,
      type: 'QUEUE_ENTRY' as const,
      queueStatus: q.status,
      queueNumber: q.queueNumber,
      time: new Date(q.enteredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patient: q.patient,
      doctorName: q.appointment?.dentistUser?.fullName || 'Unassigned clinician',
      service: q.appointment?.serviceDescription || `${q.queueType} Consultation`,
      stage: (
        q.status === 'IN_CONSULTATION'
          ? 'WITH_DOCTOR'
          : q.status === 'COMPLETED'
          ? 'CHECKOUT'
          : 'HERE'
      ) as BoardFilter,
      stageLabel:
        q.status === 'IN_CONSULTATION'
          ? 'With Doctor'
          : q.status === 'CALLED'
          ? 'Called to Room'
          : q.status === 'COMPLETED'
          ? 'Checkout Needed'
          : 'Verified Waiting',
      stageTone:
        q.status === 'IN_CONSULTATION'
          ? 'blue'
          : q.status === 'COMPLETED'
          ? 'purple'
          : 'emerald',
      waitMinutes: Math.max(1, Math.floor((Date.now() - new Date(q.enteredAt).getTime()) / 60000)),
    })),
    // 3. Confirmed scheduled appointments not yet in queue
    ...appointments
      .filter(
        (app) =>
          app.status !== 'CANCELLED' &&
          !liveQueue.some((q) => q.appointmentId === app.id) &&
          !unverifiedArrivals.some((a) => a.appointmentId === app.id)
      )
      .map((app) => ({
        id: `app-${app.id}`,
        rawId: app.id,
        type: 'APPOINTMENT' as const,
        time: app.startTime || 'Time not assigned',
        dateStr: formatDate(app.appointmentDate),
        patient: app.patient,
        doctorName: app.dentistUser?.fullName || 'Unassigned clinician',
        service: app.serviceDescription || 'Dental Consultation',
        stage: (app.status === 'COMPLETED' ? 'COMPLETED' : 'EXPECTED') as BoardFilter,
        stageLabel: app.status === 'COMPLETED' ? 'Completed' : 'Expected Arrival',
        stageTone: app.status === 'COMPLETED' ? 'slate' : 'blue',
        waitMinutes: null,
      })),
  ];

  const filteredBoardRows =
    boardFilter === 'ALL' ? unifiedRows : unifiedRows.filter((r) => r.stage === boardFilter);

  const countExpected = unifiedRows.filter((r) => r.stage === 'EXPECTED').length;
  const countHere = unifiedRows.filter((r) => r.stage === 'HERE').length;
  const countWithDoctor = unifiedRows.filter((r) => r.stage === 'WITH_DOCTOR').length;
  const countCheckout = unifiedRows.filter((r) => r.stage === 'CHECKOUT').length;

  const userName = currentUser?.fullName?.split(' ')[0] || 'colleague';
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    timeZone: 'Africa/Cairo',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="eb-role-page eb-reception w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* PHASE 1 PATIENT RECORDS & INSTANT SEARCH (Images 1, 2, 3 — Receptionist Demographic, QR Pass, Family Linking, Upload-Only Scans & Financial Wallet) */}
      <UnifiedPatientFileView role="RECEPTIONIST" />

      {/* 1. MODERN RECEPTION COMMAND CENTER */}
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#2446A6] text-xs font-bold border border-[#D4F3E2]">
              <span className="w-2 h-2 rounded-full bg-[#2446A6] animate-pulse" />
              <span><TranslatedText text="FRONT DESK &amp; CLINIC RECEPTION" /></span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"> <TranslatedText text="Patients & Registration" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              {branchName} <TranslatedText text="· Search by name, phone or patient number." /> </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/reception/agenda"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2446A6] hover:bg-[#0c6b65] text-white text-xs font-bold shadow-xs transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span><TranslatedText text="Agenda Calendar" /></span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setReturnToTaskAfterRegister(null);
                setIsRegisterOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <UserPlus className="w-4 h-4 text-[#2446A6]" />
              <span><TranslatedText text="Register Patient" /></span>
            </button>

            <button
              type="button"
              onClick={() => setShowReconciliationDrawer(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span><TranslatedText text="Identity Tasks (" />{pendingLinks.length + duplicateReviews.length})</span>
            </button>
          </div>
        </div>

        {/* Global Patient Search Input with keyboard shortcut */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="relative rounded-2xl bg-slate-50 border border-slate-200/90 focus-within:border-[#2446A6] focus-within:ring-2 focus-within:ring-[#2446A6]/10 transition-all flex items-center px-4 py-2.5">
            <Search className="w-5 h-5 text-slate-400 mr-3 rtl:mr-0 rtl:ml-3 shrink-0" />
            <LocalizedInput
              ref={searchInputRef}
              type="search"
              aria-label="Find a patient"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, phone, ID..."
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-500 shadow-2xs"> <TranslatedText text="Ctrl K" /> </kbd>
          </div>
        </div>
      </div>

      {/* Contextual Search Results Panel (With inline Duplicate Warning & No-Match Walk-In Return) */}
      {(searchQuery.trim().length > 0 || isSearching) && (
        <div className="bg-white rounded-2xl border-2 border-[#4169E1]/25 shadow-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700"> <TranslatedText text="Results: &ldquo;" />{searchQuery}<TranslatedText text="&rdquo; (" />{searchResults.length})
            </span>
            <span className="text-slate-500"><TranslatedText text="Click row to check-in" /></span>
          </div>

          {searchResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-slate-50/70 text-slate-500 uppercase font-mono text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4"><TranslatedText text="Patient ID" /></th>
                    <th className="py-2.5 px-4"><TranslatedText text="Full Legal Name" /></th>
                    <th className="py-2.5 px-4"><TranslatedText text="Date of Birth" /></th>
                    <th className="py-2.5 px-4"><TranslatedText text="Phone" /></th>
                    <th className="py-2.5 px-4"><TranslatedText text="Record Status" /></th>
                    <th className="py-2.5 px-4 text-right rtl:text-left"><TranslatedText text="Next Action" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchResults.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setDrawerPatient(p)}
                      className="hover:bg-[#EAF3FF]/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#102A5E]">{p.patientNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#4169E1]/10 text-[#4169E1] flex items-center justify-center text-xs font-bold">
                            {p.fullName.charAt(0)}
                          </span>
                          <span>{p.fullName}</span>
                          {p.hasPendingDuplicate && (
                            <span className="px-2 py-0.5 bg-amber-100 text-[#946200] text-xs font-bold rounded-full inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> <TranslatedText text="Verify Shared Phone/Name" /> </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600"><LocalizedDate value={p.dateOfBirth} time={false}/></td>
                      <td className="py-3 px-4 font-mono text-slate-700">{p.primaryPhone}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#18794E] border border-emerald-200">
                          {p.migrationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right rtl:text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrawerPatient(p);
                          }}
                          className="eb-semantic-action eb-semantic-action--neutral eb-semantic-action--small"
                        >
                          <UserCheck size={14} aria-hidden="true"/> <TranslatedText text="Review & Verify" /> </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !isSearching ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-xs text-slate-600"> <TranslatedText text="No existing clinic file matched" /> <span className="font-bold text-slate-900">&ldquo;{searchQuery}&rdquo;</span>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRegisterForm((prev) => ({
                    ...prev,
                    fullName: /^[0-9+]/.test(searchQuery) ? '' : searchQuery,
                    primaryPhone: /^[0-9+]/.test(searchQuery) ? searchQuery : '',
                  }));
                  setReturnToTaskAfterRegister('CHECK_IN');
                  setIsRegisterOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4169E1] hover:bg-[#2446A6] text-white text-xs font-bold shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span><TranslatedText text="Create Patient & Continue Check-In" /></span>
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Preserve E2E headings in DOM for T14.2 compatibility while keeping them in compact reconciliation section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4169E1]" />
              <h3 className="text-xs font-bold text-slate-800"><TranslatedText text="Portal Link Verification Requests" /></h3>
              <span className="px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#4169E1] text-xs font-bold">
                {pendingLinks.length}
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#946200]" />
              <h3 className="text-xs font-bold text-slate-800"><TranslatedText text="Duplicate Candidate Hints" /></h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#946200] text-xs font-bold">
                {duplicateReviews.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReconciliationDrawer(!showReconciliationDrawer)}
            className="text-xs font-bold text-[#4169E1] hover:underline"
          >
            <TranslatedText text={String(showReconciliationDrawer ? 'Hide Reconciliation Queue' : 'Open Identity & Duplicate Queue')}/>
          </button>
        </div>

        {(showReconciliationDrawer || activeView === 'patients') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
            {/* Portal Links */}
            <div className="space-y-2.5">
              {pendingLinks.map((link) => (
                <div key={link.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900 block">{link.patient.fullName} ({link.patient.patientNumber})</span>
                    <span className="text-xs text-slate-500"> <TranslatedText text="Portal Account:" /> {link.user.fullName} <TranslatedText text="• Phone:" /> {link.patient.primaryPhone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleVerifyLink(link.id, 'APPROVE')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#4169E1] hover:bg-[#2446A6] text-white font-bold text-xs"
                    > <TranslatedText text="Verify &amp; Approve" /> </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyLink(link.id, 'REJECT')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs"
                    > <TranslatedText text="Reject" /> </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Duplicate Candidate Pairs */}
            <div className="space-y-2.5">
              {duplicateReviews.map((rev) => (
                <div key={rev.id} className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 text-xs flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-[#946200] block">{rev.matchType}</span>
                    <span className="text-slate-800 font-semibold">
                      {rev.patientA.fullName} ({rev.patientA.patientNumber}) ↔ {rev.patientB.fullName} ({rev.patientB.patientNumber})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResolveDuplicate(rev.id, 'REVIEWED_DISTINCT')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#18794E] hover:bg-emerald-800 text-white font-bold text-xs shrink-0"
                  > <TranslatedText text="Confirm Distinct People (Family/Shared Phone)" /> </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CONTEXTUAL PATIENT ACTION RIGHT DRAWER */}
      {drawerPatient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#102A5E] text-white font-bold flex items-center justify-center text-base">
                    {drawerPatient.fullName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{drawerPatient.fullName}</h3>
                    <p className="text-xs font-mono text-slate-500">{drawerPatient.patientNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerPatient(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Identity Verification Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="text-xs font-mono uppercase text-slate-400 block"> <TranslatedText text="Identity Verification Details" /> </span>
                <div className="flex justify-between">
                  <span className="text-slate-500"><TranslatedText text="Primary Phone:" /></span>
                  <span className="font-mono font-bold text-slate-900">{drawerPatient.primaryPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500"><TranslatedText text="Date of Birth:" /></span>
                  <span className="font-semibold text-slate-800"><LocalizedDate value={drawerPatient.dateOfBirth} time={false}/></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500"><TranslatedText text="File Status:" /></span>
                  <span className="font-bold text-[#18794E]">{drawerPatient.migrationStatus || 'FULLY_DIGITIZED'}</span>
                </div>
              </div>

              {/* Contextual Reception Actions */}
              <div className="space-y-2.5">
                <span className="text-xs font-mono uppercase text-slate-400 block"> <TranslatedText text="Reception Point-of-Care Actions" /> </span>

                <button
                  type="button"
                  onClick={() => handleReportAndVerifyArrival(drawerPatient.id)}
                  className="w-full py-3 px-4 rounded-xl bg-[#18794E] hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-between shadow-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span><TranslatedText text="Verify Arrival & Queue" /></span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <Link
                  href={`/billing?mode=checkout&patientId=${drawerPatient.id}`}
                  className="w-full py-3 px-4 rounded-xl bg-[#F59B20] hover:bg-[#e08912] text-slate-950 font-bold text-xs flex items-center justify-between shadow-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span><TranslatedText text="Patient Checkout" /></span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>

                <button className="primary-button" onClick={()=>{setBookPatient(drawerPatient);setDrawerPatient(null)}}><TranslatedText text="Book appointment"/></button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerPatient(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            > <TranslatedText text="Close Drawer (ESC)" /> </button>
          </div>
        </div>
      )}

      {bookPatient&&<ReceptionBooking initialPatient={bookPatient} branches={branches} onClose={()=>setBookPatient(null)} onSaved={()=>{setBookPatient(null);router.refresh()}}/>}
      {/* MODAL: REGISTER NEW WALK-IN PATIENT (Returns directly to Check-In task) */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900"><TranslatedText text="Register New Patient" /></h2>
                <p className="text-xs text-slate-500"> <TranslatedText text="Creates patient record." /> </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registerSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#18794E] text-xs font-bold">
                {registerSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1"><TranslatedText text="Full Legal Name *" /></label>
                <LocalizedInput
                  type="text"
                  required
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  placeholder="e.g., Karim Mahmoud El-Shazly"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1"><TranslatedText text="Primary Telephone *" /></label>
                  <LocalizedInput
                    type="tel"
                    required
                    value={registerForm.primaryPhone}
                    onChange={(e) => setRegisterForm({ ...registerForm, primaryPhone: e.target.value })}
                    placeholder="+2010..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1"><TranslatedText text="Date of Birth *" /></label>
                  <input
                    type="date"
                    required
                    value={registerForm.dateOfBirth}
                    onChange={(e) => setRegisterForm({ ...registerForm, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1"><TranslatedText text="Gender" /></label>
                  <select
                    value={registerForm.gender}
                    onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="MALE"><TranslatedText text="Male" /></option>
                    <option value="FEMALE"><TranslatedText text="Female" /></option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1"><TranslatedText text="National ID / Passport" /></label>
                  <LocalizedInput
                    type="text"
                    value={registerForm.nationalIdOrPassport}
                    onChange={(e) => setRegisterForm({ ...registerForm, nationalIdOrPassport: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                > <TranslatedText text="Cancel" /> </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="px-5 py-2 rounded-xl bg-[#4169E1] hover:bg-[#2446A6] text-white font-bold shadow-xs"
                >
                  <TranslatedText text={String(registerLoading ? 'Saving...' : 'Save & Continue to Check-In')}/>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
