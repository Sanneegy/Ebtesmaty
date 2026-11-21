'use client';

import {TranslatedText} from '@/components/TranslatedText';

import {PatientBooking} from '@/components/PatientBooking';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {localizedText} from '@/lib/interface-messages';


import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  ArrowRight,
  XCircle,
  HelpCircle,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export default function PatientAppointmentsPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [patientRecord, setPatientRecord] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientRes, reqRes] = await Promise.all([
        fetch('/api/patients/me'),
        fetch('/api/scheduling/requests'),
      ]);

      if (patientRes.ok) {
        const pData = await patientRes.json();
        setPatientRecord(pData.patient);

      }

      if (reqRes.ok) {
        const rData = await reqRes.json();
        setRequests(rData.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondOffer = async (requestId: string, response: 'ACCEPT' | 'DECLINE') => {
    try {
      const res = await fetch(`/api/scheduling/requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Action failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-16">
      {/* Header */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bento-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9F5EB] text-[#0B2528] border border-[#C8A96E]/40 text-xs font-bold mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#C8A96E]" />
              <span>{localizedText(isAr ? 'ar' : 'en', 'text_c69f0a4723')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0B2528]">
              {localizedText(isAr ? 'ar' : 'en', 'text_df78ee8683')}
            </h1>
            <p className="text-xs text-slate-500">
              {localizedText(isAr ? 'ar' : 'en', 'text_f1768b4de6')}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              disabled={!patientRecord} onClick={() => setIsModalOpen(true)}
              icon={<Plus className="w-4 h-4 text-[#C8A96E]" />}
            >
              {localizedText(isAr ? 'ar' : 'en', 'text_f8643e8e65')}
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {saved && <p role="status" className="rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 flex items-center gap-3"><CheckCircle2 size={22}/>{isAr?'تم إرسال طلبك بنجاح. سيؤكد الاستقبال الموعد؛ يمكنك متابعة حالته هنا.':'Your request was saved. Reception will confirm the appointment; track its status here.'}</p>}
        {/* Policy notice */}
        <div className="p-4 rounded-2xl bg-[#EAF3FF] border border-[#4169E1]/20 flex items-start gap-3 text-xs text-[#4169E1]">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">
              {localizedText(isAr ? 'ar' : 'en', 'text_b7e8c58cd0')}
            </span>
            {localizedText(isAr ? 'ar' : 'en', 'text_2bcbe11349')}
          </div>
        </div>

        {/* Requests & Appointments List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102A5E] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4169E1]" />
              <span>{localizedText(isAr ? 'ar' : 'en', 'text_efae2a5811')}</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-[#D8E0DC] text-[#526574]">
              {requests.length} <TranslatedText text="visits" /> </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-[#526574] text-xs"><TranslatedText text="Loading appointments..." /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#D8E0DC] p-8 space-y-3">
              <Calendar className="w-12 h-12 text-[#D8E0DC] mx-auto" />
              <h3 className="text-base font-bold text-[#102A5E]">
                {localizedText(isAr ? 'ar' : 'en', 'text_710698dafa')}
              </h3>
              <p className="text-xs text-[#526574] max-w-sm mx-auto">
                {localizedText(isAr ? 'ar' : 'en', 'text_d73d4882e3')}
              </p>
              <div className="pt-2">
                <Button size="sm" variant="primary" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
                  {localizedText(isAr ? 'ar' : 'en', 'text_8c3f3d0e48')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl border border-[#D8E0DC] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E8ECE9]">
                      <span className="text-xs font-bold text-[#102A5E] flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#4169E1]" />
                        <span><TranslatedText text={String(req.branch.name)}/></span>
                      </span>
                      <StatusBadge status={req.status} />
                    </div>

                    <h3 className="text-base font-extrabold text-[#102A5E]">
                      <TranslatedText text={req.serviceName || "Consultation"}/>
                    </h3>

                    <div className="space-y-1.5 text-xs text-[#526574]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#4169E1]" />
                        <span className="font-semibold text-[#102A5E]">
                          {new Date(req.preferredDate).toLocaleDateString(isAr?'ar-EG':'en-GB',{timeZone:'Africa/Cairo'})}
                        </span>
                        <span className="text-[#D8E0DC]">|</span>
                        <span>{req.selectedStartTime || <TranslatedText text={String(req.preferredTimeWindow)}/>}</span>
                      </div>

                      {req.reason && (
                        <p className="text-xs text-[#526574] italic bg-[#F7FAFF] p-2.5 rounded-xl border border-[#E8ECE9]">
                          &ldquo;{req.reason}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Confirmed Appointment Details */}
                    {req.appointment && (
                      <div className="p-3.5 rounded-2xl bg-[#EAF3FF] border border-[#4169E1]/30 text-[#4169E1] text-xs space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span><TranslatedText text="Confirmed Booking Details:" /></span>
                        </div>
                        <div className="text-[#102A5E]"> <TranslatedText text="Date:" /> <span className="font-bold">{new Date(req.appointment.appointmentDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[#102A5E]"> <TranslatedText text="Time:" /> <span className="font-bold">{req.appointment.startTime} – {req.appointment.endTime}</span> ({req.appointment.durationMinutes} <TranslatedText text="min)" /> </div>
                      </div>
                    )}

                    {/* Alternative Offered Banner */}
                    {req.status === 'ALTERNATIVE_PROPOSED' && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span><TranslatedText text="Reception Offered Alternative Slot:" /></span>
                        </div>
                        <div className="font-semibold text-[#102A5E]">
                          {new Date(req.alternativeOfferedDate).toLocaleDateString()} <TranslatedText text="at" /> {req.alternativeOfferedTime}
                        </div>
                        {req.staffNotes && (
                          <div className="text-xs text-[#526574] italic">&ldquo;{req.staffNotes}&rdquo;</div>
                        )}
                        <div className="pt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleRespondOffer(req.id, 'ACCEPT')}
                          > <TranslatedText text="Accept Alternative Slot" /> </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRespondOffer(req.id, 'DECLINE')}
                          > <TranslatedText text="Decline" /> </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E8ECE9] text-xs text-[#526574] flex justify-between items-center">
                    <span><TranslatedText text="Requested:" /> {new Date(req.createdAt).toLocaleDateString()}</span>
                    {req.status === 'REQUESTED' && (
                      <span className="text-[#4169E1] font-bold"><TranslatedText text="Awaiting staff review" /></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && patientRecord && <PatientBooking patientId={patientRecord.id} onClose={()=>setIsModalOpen(false)} onSaved={()=>{setSaved(true);setIsModalOpen(false);fetchData();}} />}
    </div>
  );
}
