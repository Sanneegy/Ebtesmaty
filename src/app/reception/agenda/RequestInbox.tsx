'use client';
import {LocalizedTextarea} from '@/components/LocalizedControls';

import {TranslatedText} from '@/components/TranslatedText';


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

export default function ReceptionAgendaPage({branchCode,doctors}:{branchCode:string;doctors:{id:string;fullName:string}[]}) {
  const { locale, t } = useLanguage();
  const [activeView, setActiveView] = useState<'calendar' | 'inbox'>('inbox');
  const [selectedBranchCode, setSelectedBranchCode] = useState<'BR-A' | 'BR-B' | 'BR-C'>(branchCode as 'BR-A'|'BR-B'|'BR-C');
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
  const branchDentists=doctors.map(d=>({...d,name:d.fullName,nameEn:d.fullName,nameAr:d.fullName}));

  useEffect(() => {
    fetchData();
  }, [selectedBranchCode, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Requests
      const reqRes = await fetch(`/api/scheduling/requests?branchCode=${selectedBranchCode}`);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests((data.requests||[]).filter((r:any)=>['REQUESTED','IN_REVIEW','AWAITING_PATIENT','ALTERNATIVE_PROPOSED'].includes(r.status)));
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#2446A6] text-xs font-bold border border-[#D4F3E2]">
                <span className="w-2 h-2 rounded-full bg-[#2446A6] animate-pulse" />
                <span><TranslatedText text="OPERATORY SCHEDULE &amp; TRIAGE AGENDA" /></span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"> <TranslatedText text="Booking request inbox" /> </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl"> <TranslatedText text="Multi-dentist operatory room allocations, doctor duty shifts, and incoming patient booking requests." /> </p>
            </div>
          </div>

          {/* Controls Bar: Branch Selector, Date Picker, View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-50 border border-slate-200/80">
              <button
                onClick={() => {window.location.href='/reception/agenda'}}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'calendar'
                    ? 'bg-[#2446A6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span><TranslatedText text="Operatory Grid" /></span>
              </button>
              <button
                onClick={() => setActiveView('inbox')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'inbox'
                    ? 'bg-[#2446A6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span><TranslatedText text="Request Inbox" /></span>
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
              className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#2446A6]/20"
            />

            <select
              value={selectedBranchCode}
              onChange={(e) => setSelectedBranchCode(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#2446A6]/20 cursor-pointer"
            >
              <option value="BR-A"><TranslatedText text="Branch A — Heliopolis" /></option>
              <option value="BR-B"><TranslatedText text="Branch B — New Cairo" /></option>
              <option value="BR-C"><TranslatedText text="Branch C — Maadi" /></option>
            </select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData} 
              className="rounded-full px-4 py-2 text-xs font-bold"
              leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            > <TranslatedText text="Refresh" /> </Button>
          </div>
        </div>
      </div>

      {/* 2. Operatory Velocity & Triage Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block"><TranslatedText text="Branch Capacity" /></span>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {currentBranch.operatoriesCount} <TranslatedText text="Operatories" /> </div>
          <span className="text-xs text-[#2446A6] font-bold block">
            {branchDentists.length} <TranslatedText text="Specialists Assigned" /> </span>
        </div>

        <div className="p-5 bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block"><TranslatedText text="Scheduled Today" /></span>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {appointments.length} <TranslatedText text="Consultations" /> </div>
          <span className="text-xs text-slate-400 block"> <TranslatedText text="Across active operatory suites" /> </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#D8E0DC] shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#526574] block"><TranslatedText text="Pending Triage Review" /></span>
          <div className="text-xl font-extrabold text-[#F28C28] mt-0.5">
            {pendingRequestsCount} <TranslatedText text="Requests" /> </div>
          <span className="text-xs text-[#F28C28] font-semibold mt-0.5 block"> <TranslatedText text="Awaiting slot confirmation" /> </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#D8E0DC] shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#526574] block"><TranslatedText text="Operating Hours" /></span>
          <div className="text-base font-bold text-[#102A5E] mt-1 truncate">
            {currentBranch.hoursEn}
          </div>
          <span className="text-xs text-[#526574] mt-0.5 block"> <TranslatedText text="Receptionist:" /> {currentBranch.receptionistNameEn}
          </span>
        </div>
      </div>

      {/* VIEW 1: MULTI-DENTIST OPERATORY CALENDAR GRID */}
      {/* VIEW 2: REQUEST INBOX TABLE */}
      {activeView === 'inbox' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#4169E1]" />
                <span><TranslatedText text="Pending Patient Visit Requests (" />{pendingRequestsCount})</span>
              </CardTitle>
              <span className="text-xs text-[#526574] font-semibold"><TranslatedText text="Scope:" /> {currentBranch.nameEn}</span>
            </div>
            <CardDescription> <TranslatedText text="Verify doctor duty and room capacity before confirming appointments. Propose an alternative if the requested time slot is unavailable." /> </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-xs text-slate-400"><TranslatedText text="Loading requests..." /></div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 italic"> <TranslatedText text="No pending appointment requests for this branch." /> </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#D8E0DC] text-[#526574] font-bold uppercase tracking-wider bg-[#F7FAFF]">
                      <th className="py-3 px-3.5"><TranslatedText text="Patient" /></th>
                      <th className="py-3 px-3.5"><TranslatedText text="Requested Service" /></th>
                      <th className="py-3 px-3.5"><TranslatedText text="Preferred Date / Window" /></th>
                      <th className="py-3 px-3.5"><TranslatedText text="Status" /></th>
                      <th className="py-3 px-3.5 text-right"><TranslatedText text="Actions" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3.5">
                          <div className="font-bold text-[#102A5E]">{req.patient.fullName}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            {req.patient.patientNumber} • {req.patient.primaryPhone}
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 font-semibold text-slate-700">
                          {req.serviceName || <TranslatedText text="Consultation"/>}
                        </td>
                        <td className="py-3.5 px-3.5 text-slate-600">
                          <div>{new Date(req.preferredDate).toLocaleDateString()}</div>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            <TranslatedText text={String(req.preferredTimeWindow)}/>
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
                            <TranslatedText text={String(req.status)}/>
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
                                setConfirmDentistId(req.dentistPreferenceId||branchDentists[0]?.id||'');setConfirmTime(req.selectedStartTime||'10:00');
                              }}
                            > <TranslatedText text="Review &amp; Schedule" /> </Button>
                          ) : (
                            <span className="text-slate-400 text-xs italic"><TranslatedText text="Processed" /></span>
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

      {/* Review & Schedule Slide-Over Drawer */}
      {activeReviewReq && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#0B2528]/25 backdrop-blur-xs"
            onClick={() => setActiveReviewReq(null)}
          />
          <div className="fixed inset-y-3 right-3 rtl:right-auto rtl:left-3 w-[calc(100vw-1.5rem)] max-w-xl rounded-3xl backdrop-blur-2xl bg-white/95 p-6 space-y-4 shadow-2xl border border-white/60 z-50 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#C8A96E]"><TranslatedText text="Receptionist Triage" /></span>
                <h3 className="text-base font-extrabold text-[#0B2528]"> <TranslatedText text="Process Request:" /> {activeReviewReq.patient.fullName}
                </h3>
              </div>
              <button
                onClick={() => setActiveReviewReq(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full bg-[#F7F6F2]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F7FAFF] p-3.5 rounded-2xl border border-[#D8E0DC] text-xs space-y-1">
              <div>
                <span className="text-[#526574]"><TranslatedText text="Requested Service:" /></span>{' '}
                <strong className="text-[#102A5E]">{activeReviewReq.serviceName || 'General Consultation'}</strong>
              </div>
              <div>
                <span className="text-[#526574]"><TranslatedText text="Patient Note:" /></span>{' '}
                <span className="italic text-slate-700">&quot;{activeReviewReq.reason}&quot;</span>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#102A5E] block mb-1"><TranslatedText text="Triage Action *" /></label>
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
                          ? 'bg-[#4169E1] text-white border-[#4169E1]'
                          : 'bg-white border-[#D8E0DC] text-[#102A5E] hover:bg-[#F7FAFF]'
                      }`}
                    >
                      <TranslatedText text={String(act.label)}/>
                    </button>
                  ))}
                </div>
              </div>

              {actionType === 'CONFIRM' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-[#102A5E] block mb-1"><TranslatedText text="Attending Specialist *" /></label>
                    <select
                      value={confirmDentistId}
                      onChange={(e) => setConfirmDentistId(e.target.value)}
                      className="w-full text-xs rounded-xl border border-[#D8E0DC] bg-white p-2.5 font-medium"
                    >
                      {branchDentists.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.nameEn} ()
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#102A5E] block mb-1"><TranslatedText text="Date *" /></label>
                      <input
                        type="date"
                        value={confirmDate}
                        onChange={(e) => setConfirmDate(e.target.value)}
                        className="w-full text-xs rounded-xl border border-[#D8E0DC] p-2.5"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#102A5E] block mb-1"><TranslatedText text="Time *" /></label>
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
                    <label className="text-xs font-bold text-[#102A5E] block mb-1"><TranslatedText text="Proposed Date *" /></label>
                    <input
                      type="date"
                      value={confirmDate}
                      onChange={(e) => setConfirmDate(e.target.value)}
                      className="w-full text-xs rounded-xl border border-[#D8E0DC] p-2.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#102A5E] block mb-1"><TranslatedText text="Proposed Time *" /></label>
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
                <label className="text-xs font-bold text-[#102A5E] block mb-1"><TranslatedText text="Receptionist Notes" /></label>
                <LocalizedTextarea
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="Internal notes or rationale for confirmation/decline..."
                  rows={2}
                  className="w-full text-xs rounded-xl border border-[#D8E0DC] p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setActiveReviewReq(null)}> <TranslatedText text="Cancel" /> </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={submitting}> <TranslatedText text="Complete Action" /> </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
