'use client';
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
  const [submitting, setSubmitting] = useState(false);
  const [patientRecord, setPatientRecord] = useState<any>(null);

  const [formData, setFormData] = useState({
    branchId: 'BR-A',
    serviceName: 'Comprehensive Oral Exam',
    preferredDate: '',
    preferredTimeWindow: 'MORNING',
    reason: '',
  });

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
        if (pData.patient?.primaryBranchId) {
          setFormData((prev) => ({ ...prev, branchId: pData.patient.primaryBranchId }));
        }
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

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientRecord) return;
    setSubmitting(true);
    try {
      const targetBranchId = patientRecord.primaryBranchId || formData.branchId;
      const res = await fetch('/api/scheduling/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientRecord.id,
          branchId: targetBranchId,
          preferredDate: formData.preferredDate,
          preferredTimeWindow: formData.preferredTimeWindow,
          serviceName: formData.serviceName,
          reason: formData.reason,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          branchId: 'BR-A',
          serviceName: 'Comprehensive Oral Exam',
          preferredDate: '',
          preferredTimeWindow: 'MORNING',
          reason: '',
        });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit request');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-[#F7F8F5] pb-16">
      {/* Header */}
      <div className="bg-white border-b border-[#D8E0DC] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EAF3FF] text-[#176C5B] text-xs font-bold mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{localizedText(isAr ? 'ar' : 'en', 'text_c69f0a4723')}</span>
            </div>
            <h1 className="text-xl font-extrabold text-[#163447]">
              {localizedText(isAr ? 'ar' : 'en', 'text_df78ee8683')}
            </h1>
            <p className="text-xs text-[#526574]">
              {localizedText(isAr ? 'ar' : 'en', 'text_f1768b4de6')}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              {localizedText(isAr ? 'ar' : 'en', 'text_f8643e8e65')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Policy notice */}
        <div className="p-4 rounded-2xl bg-[#EAF3FF] border border-[#176C5B]/20 flex items-start gap-3 text-xs text-[#176C5B]">
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
            <h2 className="text-base font-bold text-[#163447] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#176C5B]" />
              <span>{localizedText(isAr ? 'ar' : 'en', 'text_efae2a5811')}</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-[#D8E0DC] text-[#526574]">
              {requests.length} visits
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-[#526574] text-xs">Loading appointments...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#D8E0DC] p-8 space-y-3">
              <Calendar className="w-12 h-12 text-[#D8E0DC] mx-auto" />
              <h3 className="text-base font-bold text-[#163447]">
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
                      <span className="text-xs font-bold text-[#163447] flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#176C5B]" />
                        <span>{req.branch.name}</span>
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          req.status === 'CONFIRMED'
                            ? 'bg-[#EAF3FF] text-[#176C5B]'
                            : req.status === 'ALTERNATIVE_PROPOSED'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'DECLINED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-[#F7F8F5] text-[#163447] border border-[#D8E0DC]'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#163447]">
                      {req.serviceName || 'Consultation'}
                    </h3>

                    <div className="space-y-1.5 text-xs text-[#526574]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#176C5B]" />
                        <span className="font-semibold text-[#163447]">
                          {new Date(req.preferredDate).toLocaleDateString()}
                        </span>
                        <span className="text-[#D8E0DC]">|</span>
                        <span>{req.preferredTimeWindow}</span>
                      </div>

                      {req.reason && (
                        <p className="text-xs text-[#526574] italic bg-[#F7F8F5] p-2.5 rounded-xl border border-[#E8ECE9]">
                          &ldquo;{req.reason}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Confirmed Appointment Details */}
                    {req.appointment && (
                      <div className="p-3.5 rounded-2xl bg-[#EAF3FF] border border-[#176C5B]/30 text-[#176C5B] text-xs space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Confirmed Booking Details:</span>
                        </div>
                        <div className="text-[#163447]">
                          Date: <span className="font-bold">{new Date(req.appointment.appointmentDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[#163447]">
                          Time: <span className="font-bold">{req.appointment.startTime} – {req.appointment.endTime}</span> ({req.appointment.durationMinutes} min)
                        </div>
                      </div>
                    )}

                    {/* Alternative Offered Banner */}
                    {req.status === 'ALTERNATIVE_PROPOSED' && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Reception Offered Alternative Slot:</span>
                        </div>
                        <div className="font-semibold text-[#163447]">
                          {new Date(req.alternativeOfferedDate).toLocaleDateString()} at {req.alternativeOfferedTime}
                        </div>
                        {req.staffNotes && (
                          <div className="text-xs text-[#526574] italic">&ldquo;{req.staffNotes}&rdquo;</div>
                        )}
                        <div className="pt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleRespondOffer(req.id, 'ACCEPT')}
                          >
                            Accept Alternative Slot
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRespondOffer(req.id, 'DECLINE')}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E8ECE9] text-xs text-[#526574] flex justify-between items-center">
                    <span>Requested: {new Date(req.createdAt).toLocaleDateString()}</span>
                    {req.status === 'REQUESTED' && (
                      <span className="text-[#176C5B] font-bold">Awaiting staff review</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Appointment Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#163447]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-xl border border-[#D8E0DC]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8ECE9]">
              <h3 className="text-lg font-bold text-[#163447]">
                {localizedText(isAr ? 'ar' : 'en', 'text_185514fbb6')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#526574] hover:text-[#163447] p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#163447] mb-1.5">
                  {localizedText(isAr ? 'ar' : 'en', 'text_27572ec2de')}
                </label>
                <select
                  required
                  value={formData.branchId || patientRecord?.primaryBranchId || 'BR-A'}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] text-[#163447] focus:border-[#176C5B] focus:outline-none"
                >
                  <option value="BR-A">Branch A — Heliopolis (مصر الجديدة)</option>
                  <option value="BR-B">Branch B — New Cairo (التجمع الخامس)</option>
                  <option value="BR-C">Branch C — Maadi (المعادي)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#163447] mb-1.5">
                  {localizedText(isAr ? 'ar' : 'en', 'text_b6ff9bdc91')}
                </label>
                <select
                  required
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] text-[#163447] focus:border-[#176C5B] focus:outline-none"
                >
                  <option value="Comprehensive Oral Exam">Comprehensive Oral Exam & Check-up (فحص شامل)</option>
                  <option value="Root Canal Therapy">Root Canal Therapy Consultation (علاج جذور)</option>
                  <option value="Teeth Cleaning & Scaling">Teeth Cleaning & Scaling (تنظيف وتلميع)</option>
                  <option value="Cosmetic Veneers / Crown">Cosmetic Veneers or Crowns (تركيبات وتجميل)</option>
                  <option value="Toothache / Emergency">Tooth Pain / Urgent Concern (ألم أسنان عاجل)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#163447] mb-1.5">
                    {localizedText(isAr ? 'ar' : 'en', 'text_9b40e12206')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] text-[#163447] focus:border-[#176C5B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#163447] mb-1.5">
                    {localizedText(isAr ? 'ar' : 'en', 'text_af966d6c5c')}
                  </label>
                  <select
                    value={formData.preferredTimeWindow}
                    onChange={(e) => setFormData({ ...formData, preferredTimeWindow: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] text-[#163447] focus:border-[#176C5B] focus:outline-none"
                  >
                    <option value="MORNING">Morning (10:00 AM – 2:00 PM)</option>
                    <option value="AFTERNOON">Afternoon (2:00 PM – 6:00 PM)</option>
                    <option value="EVENING">Evening (6:00 PM – 10:00 PM)</option>
                    <option value="ANYTIME">Any Available Time (أي وقت)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#163447] mb-1.5">
                  {localizedText(isAr ? 'ar' : 'en', 'text_ea41abd0e5')}
                </label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Describe any sensitivity, broken filling, or symptoms..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] text-[#163447] focus:border-[#176C5B] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                  Submit Visit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
