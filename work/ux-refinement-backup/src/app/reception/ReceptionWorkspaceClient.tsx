'use client';

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
    dateOfBirth: '1992-05-15',
    gender: 'MALE',
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

      // Immediately verify since receptionist is performing physical check-in at desk
      const verRes = await fetch(`/api/scheduling/arrivals/${arrData.arrival.id}/verify`, {
        method: 'POST',
      });
      if (verRes.ok) {
        setActionMessage('Patient checked in and verified in live waiting queue.');
        setDrawerPatient(null);
        await fetchArrivalsAndQueue();
        router.refresh();
      }
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
        body: JSON.stringify({ targetStatus }),
      });
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
    <div className="eb-role-page eb-reception max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. MODERN RECEPTION COMMAND CENTER (Matching Image 1 & 5) */}
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#0F827B] text-xs font-bold border border-[#D4F3E2]">
              <span className="w-2 h-2 rounded-full bg-[#0F827B] animate-pulse" />
              <span>FRONT DESK &amp; CLINIC RECEPTION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Good Morning, {userName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              {branchName} • Live patient arrivals, queue verification, appointment agenda, and desk checkout.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/reception/agenda"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F827B] hover:bg-[#0c6b65] text-white text-xs font-bold shadow-xs transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda Calendar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setReturnToTaskAfterRegister('CHECK_IN');
                setIsRegisterOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <UserPlus className="w-4 h-4 text-[#0F827B]" />
              <span>Register Patient</span>
            </button>

            <button
              type="button"
              onClick={() => setShowReconciliationDrawer(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Identity Tasks ({pendingLinks.length + duplicateReviews.length})</span>
            </button>
          </div>
        </div>

        {/* Global Patient Search Input with keyboard shortcut */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="relative rounded-2xl bg-slate-50 border border-slate-200/90 focus-within:border-[#0F827B] focus-within:ring-2 focus-within:ring-[#0F827B]/10 transition-all flex items-center px-4 py-2.5">
            <Search className="w-5 h-5 text-slate-400 mr-3 rtl:mr-0 rtl:ml-3 shrink-0" />
            <input
              ref={searchInputRef}
              type="search"
              aria-label="Find a patient"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, phone, ID..."
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-2xs">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* 2. 4 HIGH-FIDELITY LIVE FLOW COUNTER CARDS WITH MINIMAL WORDS & ACCORDION EXPANSION */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Due to Arrive */}
        <button
          onClick={() => setBoardFilter(boardFilter === 'EXPECTED' ? 'ALL' : 'EXPECTED')}
          type="button"
          aria-pressed={boardFilter === 'EXPECTED'}
          className={`text-left rtl:text-right p-5 rounded-[24px] border transition-all cursor-pointer ${
            boardFilter === 'EXPECTED'
              ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-400/20 shadow-xs'
              : 'bg-white/95 backdrop-blur-md border-slate-100 hover:border-amber-200 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tabular-nums">{countExpected}</span>
            <span className="text-xs font-bold text-amber-700">Expected</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Click to filter</p>
        </button>

        {/* Card 2: Waiting Queue */}
        <button
          onClick={() => setBoardFilter(boardFilter === 'HERE' ? 'ALL' : 'HERE')}
          type="button"
          aria-pressed={boardFilter === 'HERE'}
          className={`text-left rtl:text-right p-5 rounded-[24px] border transition-all cursor-pointer ${
            boardFilter === 'HERE'
              ? 'border-emerald-400 bg-emerald-50/80 ring-2 ring-emerald-400/20 shadow-xs'
              : 'bg-white/95 backdrop-blur-md border-slate-100 hover:border-emerald-200 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-800 tabular-nums">{countHere}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              In Lounge
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Click to filter</p>
        </button>

        {/* Card 3: In Treatment */}
        <button
          onClick={() => setBoardFilter(boardFilter === 'WITH_DOCTOR' ? 'ALL' : 'WITH_DOCTOR')}
          type="button"
          aria-pressed={boardFilter === 'WITH_DOCTOR'}
          className={`text-left rtl:text-right p-5 rounded-[24px] border transition-all cursor-pointer ${
            boardFilter === 'WITH_DOCTOR'
              ? 'border-emerald-400 bg-emerald-50/80 ring-2 ring-emerald-400/20 shadow-xs'
              : 'bg-white/95 backdrop-blur-md border-slate-100 hover:border-emerald-200 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tabular-nums">{countWithDoctor}</span>
            <span className="text-xs font-bold text-emerald-700">In Chair</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Click to filter</p>
        </button>

        {/* Card 4: Checkout Ready */}
        <button
          onClick={() => setBoardFilter(boardFilter === 'CHECKOUT' ? 'ALL' : 'CHECKOUT')}
          type="button"
          aria-pressed={boardFilter === 'CHECKOUT'}
          className={`text-left rtl:text-right p-5 rounded-[24px] border transition-all cursor-pointer ${
            boardFilter === 'CHECKOUT'
              ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-400/20 shadow-xs'
              : 'bg-white/95 backdrop-blur-md border-slate-100 hover:border-amber-200 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tabular-nums">{countCheckout}</span>
            <span className="text-xs font-bold text-amber-700">Checkout</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Click to filter</p>
        </button>
      </div>

      {/* Contextual Search Results Panel (With inline Duplicate Warning & No-Match Walk-In Return) */}
      {(searchQuery.trim().length > 0 || isSearching) && (
        <div className="bg-white rounded-2xl border-2 border-[#1F6FB2]/25 shadow-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              Results: &ldquo;{searchQuery}&rdquo; ({searchResults.length})
            </span>
            <span className="text-slate-500">Click row to check-in</span>
          </div>

          {searchResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-slate-50/70 text-slate-500 uppercase font-mono text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Patient ID</th>
                    <th className="py-2.5 px-4">Full Legal Name</th>
                    <th className="py-2.5 px-4">Date of Birth</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4">Record Status</th>
                    <th className="py-2.5 px-4 text-right rtl:text-left">Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchResults.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setDrawerPatient(p)}
                      className="hover:bg-[#EAF3FF]/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#163447]">{p.patientNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1F6FB2]/10 text-[#1F6FB2] flex items-center justify-center text-[11px] font-bold">
                            {p.fullName.charAt(0)}
                          </span>
                          <span>{p.fullName}</span>
                          {p.hasPendingDuplicate && (
                            <span className="px-2 py-0.5 bg-amber-100 text-[#946200] text-[10px] font-bold rounded-full inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Verify Shared Phone/Name
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(p.dateOfBirth)}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{p.primaryPhone}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#18794E] border border-emerald-200">
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
                          <UserCheck size={14} aria-hidden="true"/> Review & Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !isSearching ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-xs text-slate-600">
                No existing clinic file matched <span className="font-bold text-slate-900">&ldquo;{searchQuery}&rdquo;</span>.
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1F6FB2] hover:bg-[#13558C] text-white text-xs font-bold shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Patient & Continue Check-In</span>
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* CANONICAL TODAY'S APPOINTMENT & ARRIVAL BOARD (Above the Fold) */}
      <div className="eb-appointment-board bg-white rounded-[28px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EBF9F1] text-[#0F827B] flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Today&apos;s Appointment &amp; Arrival Board
              </h2>
              <span className="text-[11px] text-slate-400">
                Live operatory allocation and reception arrival queue • ({filteredBoardRows.length} visits)
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-slate-50 border border-slate-200/80">
            {(
              [
                { key: 'ALL', label: 'All' },
                { key: 'EXPECTED', label: 'Expected' },
                { key: 'HERE', label: 'Waiting Lounge' },
                { key: 'WITH_DOCTOR', label: 'In Chair' },
                { key: 'CHECKOUT', label: 'Checkout' },
                { key: 'COMPLETED', label: 'Completed' },
              ] as { key: BoardFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setBoardFilter(tab.key)}
                aria-pressed={boardFilter === tab.key}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  boardFilter === tab.key
                    ? 'bg-[#0F827B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              type="button"
              onClick={fetchArrivalsAndQueue}
              title="Refresh Live Board"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 ml-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBoard ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Board Table */}
        {filteredBoardRows.length === 0 ? (
          <div className="py-10 px-6 text-center space-y-2">
            <Calendar className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">
              No matching visits ({boardFilter.toLowerCase()}).
            </p>
            <p className="text-[11px] text-slate-500">
              Search or switch filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Time / Slot</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Treating Dentist</th>
                  <th className="py-2.5 px-4">Procedure / Reason</th>
                  <th className="py-2.5 px-4">Flow Status</th>
                  <th className="py-2.5 px-4 text-right rtl:text-left">Primary Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBoardRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setDrawerPatient(row.patient)}
                    className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      <span>{row.time}</span>
                      {'dateStr' in row && row.dateStr && (
                        <span className="block text-[10px] text-slate-400 font-normal">{row.dateStr}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#1F6FB2]/10 text-[#1F6FB2] font-bold flex items-center justify-center text-xs shrink-0">
                          {row.patient?.fullName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{row.patient?.fullName}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {row.patient?.patientNumber} • {row.patient?.primaryPhone}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-[#1F6FB2]" />
                        <span>{row.doctorName}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.service}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <StatusTag
                          size="sm"
                          variant={row.stage === 'COMPLETED' ? 'verified' : row.stage === 'WITH_DOCTOR' ? 'action' : row.stage === 'HERE' || row.stage === 'CHECKOUT' ? 'warning' : 'neutral'}
                          label={row.stageLabel + (row.waitMinutes !== null ? ` (${row.waitMinutes}m)` : '')}
                        />
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right rtl:text-left whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {row.type === 'UNVERIFIED_ARRIVAL' && (
                        <button
                          type="button"
                          disabled={busyActionId === row.rawId}
                          onClick={() => handleVerifyArrival(row.rawId)}
                          className="eb-semantic-action eb-semantic-action--success eb-semantic-action--small"
                        >
                          <CheckCircle2 size={14} aria-hidden="true" />{busyActionId === row.rawId ? 'Verifying...' : 'Verify Presence'}
                        </button>
                      )}

                      {row.type === 'APPOINTMENT' && row.stage === 'EXPECTED' && (
                        <button
                          type="button"
                          disabled={busyActionId === row.patient?.id}
                          onClick={() => handleReportAndVerifyArrival(row.patient.id, row.rawId)}
                          className="eb-semantic-action eb-semantic-action--success eb-semantic-action--small"
                        >
                          <UserCheck size={14} aria-hidden="true"/> Verify &amp; Check In
                        </button>
                      )}

                      {row.type === 'QUEUE_ENTRY' && row.queueStatus === 'WAITING' && (
                        <button
                          type="button"
                          disabled={busyActionId === row.rawId}
                          onClick={() => handleQueueTransition(row.rawId, 'IN_CONSULTATION')}
                          className="eb-semantic-action eb-semantic-action--primary eb-semantic-action--small"
                        >
                          <Stethoscope size={14} aria-hidden="true" /> Send to Operatory
                        </button>
                      )}

                      {row.type === 'QUEUE_ENTRY' && row.queueStatus === 'IN_CONSULTATION' && (
                        <button
                          type="button"
                          disabled={busyActionId === row.rawId}
                          onClick={() => handleQueueTransition(row.rawId, 'COMPLETED')}
                          className="eb-semantic-action eb-semantic-action--neutral eb-semantic-action--small"
                        >
                          <ArrowRightLeft size={14} aria-hidden="true"/> Move to Checkout
                        </button>
                      )}

                      {row.stage === 'CHECKOUT' && (
                        <Link
                          href={`/billing?mode=checkout&patientId=${row.patient?.id}`}
                          className="eb-semantic-action eb-semantic-action--neutral eb-semantic-action--small"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Record Payment</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Compact Operational Strips: Pending Appointment Changes & On-Duty Doctor Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compact Strip 1: Pending Appointment Requests */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#6941A5]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pending Appointment Requests ({initialPendingRequests.length})
              </h3>
            </div>
            <Link
              href="/reception/agenda"
              className="text-xs font-bold text-[#1F6FB2] hover:underline inline-flex items-center gap-1"
            >
              <span>Review in Appointments</span>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>

          {initialPendingRequests.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">
              All requests processed.
            </p>
          ) : (
            <div className="space-y-2">
              {initialPendingRequests.slice(0, 3).map((req: any) => (
                <div
                  key={req.id}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{req.patient?.fullName}</span>
                    <span className="text-slate-500 ml-2">
                      • {req.serviceName || 'Checkup'} ({req.preferredTimeWindow})
                    </span>
                  </div>
                  <Link
                    href="/reception/agenda"
                    className="px-2.5 py-1 rounded-lg bg-[#6941A5]/10 text-[#6941A5] font-bold text-[11px] hover:bg-[#6941A5] hover:text-white transition-colors"
                  >
                    Assign Slot
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compact Strip 2: Doctor Duty Roster & Coverage */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#18794E]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Doctor Coverage &amp; Duty Windows ({initialDoctorDuties.length})
              </h3>
            </div>
            <Link
              href="/reception/agenda"
              className="text-xs font-bold text-[#1F6FB2] hover:underline"
            >
              Manage Roster
            </Link>
          </div>

          {initialDoctorDuties.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">
              Standard clinician coverage active for {branchName}.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {initialDoctorDuties.slice(0, 4).map((duty: any) => (
                <div
                  key={duty.id}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{duty.dentistUser?.fullName}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {duty.startTime} – {duty.endTime}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      duty.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-[#18794E]'
                        : 'bg-amber-50 text-[#946200]'
                    }`}
                  >
                    {duty.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preserve E2E headings in DOM for T14.2 compatibility while keeping them in compact reconciliation section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1F6FB2]" />
              <h3 className="text-xs font-bold text-slate-800">Portal Link Verification Requests</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1F6FB2] text-[11px] font-bold">
                {pendingLinks.length}
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#946200]" />
              <h3 className="text-xs font-bold text-slate-800">Duplicate Candidate Hints</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#946200] text-[11px] font-bold">
                {duplicateReviews.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReconciliationDrawer(!showReconciliationDrawer)}
            className="text-xs font-bold text-[#1F6FB2] hover:underline"
          >
            {showReconciliationDrawer ? 'Hide Reconciliation Queue' : 'Open Identity & Duplicate Queue'}
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
                    <span className="text-[11px] text-slate-500">
                      Portal Account: {link.user.fullName} • Phone: {link.patient.primaryPhone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleVerifyLink(link.id, 'APPROVE')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1F6FB2] hover:bg-[#13558C] text-white font-bold text-[11px]"
                    >
                      Verify &amp; Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyLink(link.id, 'REJECT')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold text-[11px]"
                    >
                      Reject
                    </button>
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
                    className="px-2.5 py-1.5 rounded-lg bg-[#18794E] hover:bg-emerald-800 text-white font-bold text-[11px] shrink-0"
                  >
                    Confirm Distinct People (Family/Shared Phone)
                  </button>
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
                  <div className="w-11 h-11 rounded-2xl bg-[#163447] text-white font-bold flex items-center justify-center text-base">
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
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Identity Verification Details
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Primary Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{drawerPatient.primaryPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date of Birth:</span>
                  <span className="font-semibold text-slate-800">{formatDate(drawerPatient.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File Status:</span>
                  <span className="font-bold text-[#18794E]">{drawerPatient.migrationStatus || 'FULLY_DIGITIZED'}</span>
                </div>
              </div>

              {/* Contextual Reception Actions */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Reception Point-of-Care Actions
                </span>

                <button
                  type="button"
                  onClick={() => handleReportAndVerifyArrival(drawerPatient.id)}
                  className="w-full py-3 px-4 rounded-xl bg-[#18794E] hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-between shadow-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Verify Arrival & Queue</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <Link
                  href={`/billing?mode=checkout&patientId=${drawerPatient.id}`}
                  className="w-full py-3 px-4 rounded-xl bg-[#F59B20] hover:bg-[#e08912] text-slate-950 font-bold text-xs flex items-center justify-between shadow-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Patient Checkout</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>

                <Link
                  href={`/portal/intake?patientId=${drawerPatient.id}&assisted=true`}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1F6FB2]" />
                    <span>Assist Medical Intake</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerPatient(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Close Drawer (ESC)
            </button>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW WALK-IN PATIENT (Returns directly to Check-In task) */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Register New Patient</h2>
                <p className="text-xs text-slate-500">
                  Creates patient record.
                </p>
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
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
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
                  <label className="block font-bold text-slate-700 mb-1">Primary Telephone *</label>
                  <input
                    type="tel"
                    required
                    value={registerForm.primaryPhone}
                    onChange={(e) => setRegisterForm({ ...registerForm, primaryPhone: e.target.value })}
                    placeholder="+2010..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth *</label>
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
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={registerForm.gender}
                    onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">National ID / Passport</label>
                  <input
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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="px-5 py-2 rounded-xl bg-[#1F6FB2] hover:bg-[#13558C] text-white font-bold shadow-xs"
                >
                  {registerLoading ? 'Saving...' : 'Save & Continue to Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
