'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowLeft,
  ChevronRight,
  Filter,
  Plus,
  RefreshCw,
  Stethoscope,
  MapPin,
  Check,
  ChevronLeft,
  CalendarDays,
  ListFilter,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { CLINIC_BRANCHES, CLINIC_DENTISTS } from '../../../config/clinic-catalog';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function ReceptionAgendaPage() {
  const { locale, t } = useLanguage();
  const [activeView, setActiveView] = useState<'calendar' | 'inbox'>('calendar');
  const [selectedBranchCode, setSelectedBranchCode] = useState<'BR-A' | 'BR-B' | 'BR-C'>('BR-A');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [requests, setRequests] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewReq, setActiveReviewReq] = useState<any | null>(null);

  // Review modal state
  const [actionType, setActionType] = useState<'CONFIRM' | 'PROPOSE_ALTERNATIVE' | 'DECLINE'>('CONFIRM');
  const [confirmDentistId, setConfirmDentistId] = useState('');
  const [confirmDate, setConfirmDate] = useState('');
  const [confirmTime, setConfirmTime] = useState('11:00');
  const [staffNotes, setStaffNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentBranch = CLINIC_BRANCHES.find(b => b.code === selectedBranchCode) || CLINIC_BRANCHES[0];
  const branchDentists = CLINIC_DENTISTS.filter(d => d.branchCodes.includes(selectedBranchCode));

  useEffect(() => {
    fetchData();
  }, [selectedBranchCode, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Requests
      const reqRes = await fetch(`/api/scheduling/requests?branchId=${selectedBranchCode}`);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.requests || []);
      }

      // 2. Fetch Availability & Bookings for the selected branch and date
      const availRes = await fetch(`/api/scheduling/availability?branchCode=${selectedBranchCode}&date=${selectedDate}`);
      if (availRes.ok) {
        const availData = await availRes.json();
        setAppointments(availData.existingAppointments || []);
      }
    } catch (err) {
      console.error('Failed to fetch agenda data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewReq) return;
    setSubmitting(true);
    try {
      const payload: any = {
        action: actionType,
        staffNotes,
      };

      if (actionType === 'CONFIRM') {
        payload.confirmData = {
          dentistUserId: confirmDentistId || branchDentists[0]?.id,
          appointmentDate: confirmDate,
          startTime: confirmTime,
          endTime: calculateEndTime(confirmTime, 45),
          serviceDescription: activeReviewReq.serviceName || 'Consultation',
        };
      } else if (actionType === 'PROPOSE_ALTERNATIVE') {
        payload.alternativeDate = confirmDate;
        payload.alternativeTime = confirmTime;
      }

      const res = await fetch(`/api/scheduling/requests/${activeReviewReq.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActiveReviewReq(null);
        setStaffNotes('');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Action failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateEndTime = (start: string, durationMin: number) => {
    const [h, m] = start.split(':').map(Number);
    const totalMin = h * 60 + m + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  // Status counters
  const pendingRequestsCount = requests.filter(r => r.status === 'REQUESTED').length;
  const confirmedCount = requests.filter(r => r.status === 'CONFIRMED').length;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP HEADER & OPERATORY CONTROLS */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-3">
            <Link 
              href="/reception" 
              className="p-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
              title="Return to Reception Desk"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#0F827B] text-xs font-bold border border-[#D4F3E2]">
                <span className="w-2 h-2 rounded-full bg-[#0F827B] animate-pulse" />
                <span>OPERATORY SCHEDULE &amp; TRIAGE AGENDA</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Reception Scheduling Calendar
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                Multi-dentist operatory room allocations, doctor duty shifts, and incoming patient booking requests.
              </p>
            </div>
          </div>

          {/* Controls Bar: Branch Selector, Date Picker, View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-50 border border-slate-200/80">
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'calendar'
                    ? 'bg-[#0F827B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Operatory Grid</span>
              </button>
              <button
                onClick={() => setActiveView('inbox')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'inbox'
                    ? 'bg-[#0F827B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Request Inbox</span>
                {pendingRequestsCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0F827B]/20"
            />

            <select
              value={selectedBranchCode}
              onChange={(e) => setSelectedBranchCode(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0F827B]/20 cursor-pointer"
            >
              <option value="BR-A">Branch A — Heliopolis</option>
              <option value="BR-B">Branch B — New Cairo</option>
              <option value="BR-C">Branch C — Maadi</option>
            </select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData} 
              className="rounded-full px-4 py-2 text-xs font-bold"
              leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Operatory Velocity & Triage Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Branch Capacity</span>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {currentBranch.operatoriesCount} Operatories
          </div>
          <span className="text-xs text-[#0F827B] font-bold block">
            {branchDentists.length} Specialists Assigned
          </span>
        </div>

        <div className="p-5 bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Scheduled Today</span>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {appointments.length} Consultations
          </div>
          <span className="text-xs text-slate-400 block">
            Across active operatory suites
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#D8E0DC] shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#526574] block">Pending Triage Review</span>
          <div className="text-xl font-extrabold text-[#F28C28] mt-0.5">
            {pendingRequestsCount} Requests
          </div>
          <span className="text-xs text-[#F28C28] font-semibold mt-0.5 block">
            Awaiting slot confirmation
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#D8E0DC] shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#526574] block">Operating Hours</span>
          <div className="text-base font-bold text-[#163447] mt-1 truncate">
            {currentBranch.hoursEn}
          </div>
          <span className="text-xs text-[#526574] mt-0.5 block">
            Receptionist: {currentBranch.receptionistNameEn}
          </span>
        </div>
      </div>

      {/* VIEW 1: MULTI-DENTIST OPERATORY CALENDAR GRID */}
      {activeView === 'calendar' && (
        <div className="bg-white rounded-3xl border border-[#D8E0DC] shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D8E0DC] gap-2">
            <div>
              <h2 className="text-base font-bold text-[#163447] flex items-center gap-2">
                <span>Operatory &amp; Specialist Daily Agenda Grid</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3FF] text-[#176C5B] text-xs font-bold">
                  {selectedBranchCode} • {selectedDate}
                </span>
              </h2>
              <p className="text-xs text-[#526574] mt-0.5">
                Column-by-specialist operatory occupancy. Green blocks represent confirmed appointments; light mint slots are available.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#176C5B]">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#176C5B]" /> Confirmed / Active
              </span>
              <span className="flex items-center gap-1.5 text-[#526574]">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#F7F8F5] border border-[#D8E0DC]" /> Open Slot
              </span>
            </div>
          </div>

          {/* Calendar Multi-Column Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Doctor Header Row */}
              <div className="grid grid-cols-12 gap-2 pb-3 border-b border-[#D8E0DC]">
                <div className="col-span-2 text-xs font-bold text-[#526574] uppercase tracking-wider flex items-center">
                  Time Slot
                </div>
                {branchDentists.map((doc, idx) => (
                  <div key={doc.id} className="col-span-5 bg-[#F7F8F5] p-3 rounded-2xl border border-[#D8E0DC] flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[#D8E0DC]">
                      <Image
                        src={doc.image || '/images/ebtesamty_official_logo.jpg'}
                        alt={doc.nameEn}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#163447] truncate">{doc.nameEn}</div>
                      <div className="text-xs text-[#176C5B] font-semibold truncate">{doc.specialtyEn}</div>
                      <div className="text-xs text-[#526574] font-mono">Operatory Suite {idx + 1}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Rows */}
              <div className="divide-y divide-slate-100 mt-2">
                {TIME_SLOTS.map((time) => (
                  <div key={time} className="grid grid-cols-12 gap-2 py-2.5 items-center">
                    <div className="col-span-2 text-xs font-mono font-bold text-[#163447] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#526574]" />
                      <span>{time}</span>
                    </div>

                    {branchDentists.map((doc, idx) => {
                      // Check if appointment exists at this time slot for this doctor
                      const matchedAppt = requests.find(
                        r => r.appointment && r.appointment.startTime === time
                      );

                      if (matchedAppt) {
                        return (
                          <div
                            key={doc.id}
                            className="col-span-5 p-3 rounded-xl bg-[#EAF3FF] border border-[#176C5B]/30 flex items-center justify-between shadow-2xs"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#163447] flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-[#176C5B]" />
                                <span>{matchedAppt.patient.fullName}</span>
                              </div>
                              <div className="text-xs text-[#526574] mt-0.5">
                                {matchedAppt.serviceName || 'Dental Consultation'} • Operatory {idx + 1}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#176C5B] text-white">
                              Confirmed
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={doc.id}
                          className="col-span-5 p-2.5 rounded-xl border border-dashed border-[#D8E0DC] hover:border-[#176C5B] hover:bg-[#F7F8F5] transition-all flex items-center justify-between text-xs text-[#526574]"
                        >
                          <span className="italic">Available Slot</span>
                          <span className="text-xs font-mono text-slate-400">45 Min Session</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: REQUEST INBOX TABLE */}
      {activeView === 'inbox' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#176C5B]" />
                <span>Pending Patient Visit Requests ({pendingRequestsCount})</span>
              </CardTitle>
              <span className="text-xs text-[#526574] font-semibold">Scope: {currentBranch.nameEn}</span>
            </div>
            <CardDescription>
              Verify doctor duty and room capacity before confirming appointments. Propose an alternative if the requested time slot is unavailable.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 italic">
                No pending appointment requests for this branch.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#D8E0DC] text-[#526574] font-bold uppercase tracking-wider bg-[#F7F8F5]">
                      <th className="py-3 px-3.5">Patient</th>
                      <th className="py-3 px-3.5">Requested Service</th>
                      <th className="py-3 px-3.5">Preferred Date / Window</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3.5">
                          <div className="font-bold text-[#163447]">{req.patient.fullName}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            {req.patient.patientNumber} • {req.patient.primaryPhone}
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 font-semibold text-slate-700">
                          {req.serviceName || 'Consultation'}
                        </td>
                        <td className="py-3.5 px-3.5 text-slate-600">
                          <div>{new Date(req.preferredDate).toLocaleDateString()}</div>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {req.preferredTimeWindow}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5">
                          <Badge
                            variant={
                              req.status === 'CONFIRMED'
                                ? 'success'
                                : req.status === 'ALTERNATIVE_PROPOSED'
                                ? 'warning'
                                : req.status === 'DECLINED'
                                ? 'danger'
                                : 'teal'
                            }
                          >
                            {req.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-3.5 text-right">
                          {req.status === 'REQUESTED' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActiveReviewReq(req);
                                setConfirmDate(new Date(req.preferredDate).toISOString().split('T')[0]);
                                setConfirmDentistId(branchDentists[0]?.id || '');
                              }}
                            >
                              Review &amp; Schedule
                            </Button>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review & Schedule Modal */}
      {activeReviewReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#D8E0DC]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#176C5B]">Receptionist Triage</span>
                <h3 className="text-base font-bold text-[#163447]">
                  Process Request: {activeReviewReq.patient.fullName}
                </h3>
              </div>
              <button
                onClick={() => setActiveReviewReq(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F7F8F5] p-3.5 rounded-2xl border border-[#D8E0DC] text-xs space-y-1">
              <div>
                <span className="text-[#526574]">Requested Service:</span>{' '}
                <strong className="text-[#163447]">{activeReviewReq.serviceName || 'General Consultation'}</strong>
              </div>
              <div>
                <span className="text-[#526574]">Patient Note:</span>{' '}
                <span className="italic text-slate-700">&quot;{activeReviewReq.reason}&quot;</span>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#163447] block mb-1">Triage Action *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'CONFIRM', label: 'Confirm Slot' },
                    { val: 'PROPOSE_ALTERNATIVE', label: 'Offer Alternative' },
                    { val: 'DECLINE', label: 'Decline Request' },
                  ].map((act) => (
                    <button
                      key={act.val}
                      type="button"
                      onClick={() => setActionType(act.val as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        actionType === act.val
                          ? 'bg-[#176C5B] text-white border-[#176C5B]'
                          : 'bg-white border-[#D8E0DC] text-[#163447] hover:bg-[#F7F8F5]'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {actionType === 'CONFIRM' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-[#163447] block mb-1">Attending Specialist *</label>
                    <select
                      value={confirmDentistId}
                      onChange={(e) => setConfirmDentistId(e.target.value)}
                      className="w-full text-xs rounded-xl border border-[#D8E0DC] bg-white p-2.5 font-medium"
                    >
                      {branchDentists.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.nameEn} ({doc.specialtyEn})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#163447] block mb-1">Date *</label>
                      <input
                        type="date"
                        value={confirmDate}
                        onChange={(e) => setConfirmDate(e.target.value)}
                        className="w-full text-xs rounded-xl border border-[#D8E0DC] p-2.5"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#163447] block mb-1">Time *</label>
                      <select
                        value={confirmTime}
                        onChange={(e) => setConfirmTime(e.target.value)}
                        className="w-full text-xs rounded-xl border border-[#D8E0DC] p-2.5 font-mono"
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {actionType === 'PROPOSE_ALTERNATIVE' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-[#163447] block mb-1">Proposed Date *</label>
                    <input
                      type="date"
                      value={confirmDate}
                      onChange={(e) => setConfirmDate(e.target.value)}
                      className="w-full text-xs rounded-xl border border-[#D8E0DC] p-2.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#163447] block mb-1">Proposed Time *</label>
                    <input
                      type="time"
                      value={confirmTime}
                      onChange={(e) => setConfirmTime(e.target.value)}
                      className="w-full text-xs rounded-xl border border-[#D8E0DC] p-2.5"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#163447] block mb-1">Receptionist Notes</label>
                <textarea
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="Internal notes or rationale for confirmation/decline..."
                  rows={2}
                  className="w-full text-xs rounded-xl border border-[#D8E0DC] p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setActiveReviewReq(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
                  Complete Action
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
