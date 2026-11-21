'use client';
import {localizedText} from '@/lib/interface-messages';


import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';
import {
  CLINIC_BRANCHES,
  CLINIC_DENTISTS,
  CLINIC_SERVICES,
} from '../../config/clinic-catalog';
import { Button } from '../../components/ui/Button';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Download,
  ExternalLink,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

interface TimeSlot {
  time: string;
  label: string;
  window: 'MORNING' | 'AFTERNOON' | 'EVENING';
  available: boolean;
}

function BookingFlowContent() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const searchParams = useSearchParams();

  // Steps: 1..8 (Steps 1-6 interactive, Step 7 submitting, Step 8 confirmation)
  const [step, setStep] = useState<number>(1);

  // Step 1: Branch
  const [branchCode, setBranchCode] = useState<string>(
    searchParams.get('branch') || 'BR-A'
  );

  // Step 2: Service / Reason
  const [serviceSlug, setServiceSlug] = useState<string>(
    searchParams.get('service') || 'dental-checkups-consultations'
  );

  // Step 3: Dentist
  const [dentistEmail, setDentistEmail] = useState<string>(
    searchParams.get('dentist') || 'ANY'
  );

  // Step 4: Date & Real Available Time Slot
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return (
      searchParams.get('date') ||
      new Date(Date.now() + 86400000).toISOString().split('T')[0]
    );
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>({
    time: '',
    label: '',
    window: 'MORNING',
    available: false,
  });

  // Step 5: Patient Details
  const [patientType, setPatientType] = useState<'NEW' | 'RETURNING'>('NEW');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [hasMedicalAlert, setHasMedicalAlert] = useState<boolean>(false);
  const [consentChecked, setConsentChecked] = useState<boolean>(false);

  // Step 7 & 8: Submission & Confirmation
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  const selectedBranchObj =
    CLINIC_BRANCHES.find((b) => b.code === branchCode) || CLINIC_BRANCHES[0];
  const selectedServiceObj =
    CLINIC_SERVICES.find((s) => s.slug === serviceSlug) || CLINIC_SERVICES[0];
  const branchDentists = CLINIC_DENTISTS.filter((d) => d.branchCode === branchCode);
  const selectedDentistObj = CLINIC_DENTISTS.find((d) => d.email === dentistEmail);

  // Fetch live availability when branch, dentist, or date changes
  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    fetch(
      `/api/scheduling/availability?branchCode=${encodeURIComponent(
        branchCode
      )}&date=${encodeURIComponent(selectedDate)}&dentistEmail=${encodeURIComponent(
        dentistEmail
      )}&service=${encodeURIComponent(serviceSlug)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data.slots)) {
          setSlots(data.slots);
          const firstAvail = data.slots.find((s: TimeSlot) => s.available);
          setSelectedSlot(firstAvail || {time:"",label:"",window:"MORNING",available:false});
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [branchCode, selectedDate, dentistEmail, serviceSlug]);

  const handleSubmitBooking = async () => {
    setError(null);
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError(localizedText(isAr ? 'ar' : 'en', 'text_3e929af9ae'));
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError(localizedText(isAr ? 'ar' : 'en', 'text_0eaf2663aa'));
      return;
    }

    if (!dob || !consentChecked || !selectedSlot.available || loadingSlots) { setError(localizedText(isAr ? 'ar' : 'en', 'text_6dfe9f1d91')); return; }
    setStep(7);
    setSubmitting(true);
    try {
      const res = await fetch('/api/scheduling/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchCode,
          serviceSlug,
          dateOfBirth:dob,
          source:"WEBSITE",
          serviceName:
            serviceSlug === 'unsure'
              ? 'General Dental Checkup & Consultation'
              : selectedServiceObj.nameEn,
          dentistEmail,
          preferredDate: selectedDate,
          preferredTimeWindow: selectedSlot.window,
          selectedSlotTime: selectedSlot.time,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          reason: `[${patientType} PATIENT | Slot: ${selectedSlot.label}${
            hasMedicalAlert ? ' | MEDICAL ALERT FLAGGED' : ''
          }] ${symptoms.trim() || selectedServiceObj.nameEn}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking');
      }
      setBookingRef(data.trackingCode || data.request?.id || 'EBT-BOOK-2026');
      setStep(8);
    } catch (err: any) {
      setError(err.message);
      setStep(6);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadIcs = () => {
    const dateClean = selectedDate.replace(/-/g, '');
    const [hh, mm] = selectedSlot.time.split(':');
    const startStr = `${dateClean}T${hh}${mm}00`;
    const endHour = String(Number(hh) + 1).padStart(2, '0');
    const endStr = `${dateClean}T${endHour}${mm}00`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ebtesamty Dental Clinics//EN',
      'BEGIN:VEVENT',
      'STATUS:TENTATIVE',
      `UID:${bookingRef || 'ebtesamty'}@ebtesamty.eg`,
      `DTSTART;TZID=Africa/Cairo:${startStr}`,
      `DTEND;TZID=Africa/Cairo:${endStr}`,
      `SUMMARY:Ebtesamty Dental Appointment - ${selectedBranchObj.nameEn}`,
      `LOCATION:${selectedBranchObj.addressEn}`,
      `DESCRIPTION:Service: ${selectedServiceObj.nameEn} | Reference: ${bookingRef}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebtesamty-appointment-${selectedDate}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stepLabels = [
    { num: 1, en: 'Branch', ar: 'الفرع' },
    { num: 2, en: 'Service', ar: 'الخدمة' },
    { num: 3, en: 'Dentist', ar: 'الطبيب' },
    { num: 4, en: 'Date & Time', ar: 'الموعد' },
    { num: 5, en: 'Patient Info', ar: 'بيانات المريض' },
    { num: 6, en: 'Review & Confirm', ar: 'المراجعة والتأكيد' },
  ];

  return (
    <div className="bg-[#F7F8F5] min-h-screen py-10 lg:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] text-[#176C5B] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>
                {localizedText(isAr ? 'ar' : 'en', 'text_7f0d297c6d')}
              </span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#163447] mt-2">
              {localizedText(isAr ? 'ar' : 'en', 'text_d95a9324b0')}
            </h1>
          </div>
          <div className="text-xs text-[#526574]">
            {localizedText(isAr ? 'ar' : 'en', 'text_4ec026b7f9')}{' '}
            <a href={"tel:"+CLINIC_BRANCHES[0].phone.replace(/\s/g,'')} className="font-bold text-[#176C5B]">
              {CLINIC_BRANCHES[0].phone}
            </a>
          </div>
        </div>

        {/* Stepper Progress */}
        {step <= 6 && (
          <div className="bg-white rounded-2xl border border-[#D8E0DC] p-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {stepLabels.map((s) => {
                const isActive = step === s.num;
                const isCompleted = step > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (s.num < step) setStep(s.num);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all text-start ${
                      isActive
                        ? 'bg-[#176C5B] text-white shadow-sm'
                        : isCompleted
                        ? 'bg-[#EAF3FF] text-[#176C5B]'
                        : 'bg-[#F7F8F5] text-[#526574]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        isActive
                          ? 'bg-white text-[#176C5B]'
                          : isCompleted
                          ? 'bg-[#176C5B] text-white'
                          : 'bg-white text-[#526574]'
                      }`}
                    >
                      {isCompleted ? '✓' : s.num}
                    </span>
                    <span className="truncate">{isAr ? s.ar : s.en}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: CHOOSE BRANCH */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#163447]">
                {localizedText(isAr ? 'ar' : 'en', 'text_e4115037b4')}
              </h2>
              <p className="text-xs text-[#526574] mt-1">
                {localizedText(isAr ? 'ar' : 'en', 'text_d86f938d8c')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CLINIC_BRANCHES.map((b) => {
                const selected = branchCode === b.code;
                return (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => {
                      setBranchCode(b.code);
                      setDentistEmail('ANY');
                    }}
                    className={`p-5 rounded-2xl border-2 text-start transition-all flex flex-col justify-between space-y-3 ${
                      selected
                        ? 'border-[#176C5B] bg-[#EAF3FF]/50 shadow-sm'
                        : 'border-[#D8E0DC] bg-[#F7F8F5] hover:border-[#176C5B]/50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#163447] text-white">
                          {b.code}
                        </span>
                        {selected && <CheckCircle2 className="w-5 h-5 text-[#176C5B]" />}
                      </div>
                      <h3 className="text-base font-bold text-[#163447]">
                        {isAr ? b.nameAr : b.nameEn}
                      </h3>
                      <p className="text-xs text-[#526574]">{isAr ? b.addressAr : b.addressEn}</p>
                    </div>
                    <div className="pt-2 border-t border-[#D8E0DC] text-xs text-[#176C5B] font-semibold">
                      {isAr ? b.hoursAr : b.hoursEn}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(2)}
                icon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {localizedText(isAr ? 'ar' : 'en', 'text_9bb32a89c5')}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE SERVICE / VISIT REASON */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#163447]">
                {localizedText(isAr ? 'ar' : 'en', 'text_b63ee218af')}
              </h2>
              <p className="text-xs text-[#526574] mt-1">
                {localizedText(isAr ? 'ar' : 'en', 'text_d8dae0ffa4')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setServiceSlug('unsure')}
                className={`p-4 rounded-2xl border-2 text-start transition-all ${
                  serviceSlug === 'unsure'
                    ? 'border-[#176C5B] bg-[#EAF3FF]/60'
                    : 'border-[#D8E0DC] bg-[#F7F8F5] hover:border-[#176C5B]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#163447]">
                    {localizedText(isAr ? 'ar' : 'en', 'text_7dfc355dfb')}
                  </span>
                  <span className="text-xs font-bold text-[#176C5B]">EGP 400</span>
                </div>
                <p className="text-xs text-[#526574] mt-1">
                  {localizedText(isAr ? 'ar' : 'en', 'text_753eda7997')}
                </p>
              </button>

              {CLINIC_SERVICES.map((srv) => {
                const selected = serviceSlug === srv.slug;
                return (
                  <button
                    key={srv.slug}
                    type="button"
                    onClick={() => setServiceSlug(srv.slug)}
                    className={`p-4 rounded-2xl border-2 text-start transition-all ${
                      selected
                        ? 'border-[#176C5B] bg-[#EAF3FF]/60'
                        : 'border-[#D8E0DC] bg-[#F7F8F5] hover:border-[#176C5B]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#163447]">
                        {isAr ? srv.nameAr : srv.nameEn}
                      </span>
                      <span className="text-xs font-bold text-[#176C5B] shrink-0">
                        EGP {srv.startingPriceEgp.toLocaleString()}+
                      </span>
                    </div>
                    <p className="text-xs text-[#526574] mt-1 line-clamp-2">
                      {isAr ? srv.shortDescAr : srv.shortDescEn}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(1)}>
                {localizedText(isAr ? 'ar' : 'en', 'text_b8a04f348b')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(3)}
                icon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {localizedText(isAr ? 'ar' : 'en', 'text_9e1c7150ff')}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: CHOOSE DENTIST */}
        {step === 3 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#163447]">
                {isAr
                  ? `الخطوة 3: اختر الطبيب المعالج في ${selectedBranchObj.nameAr}`
                  : `Step 3: Choose Your Dentist at ${selectedBranchObj.nameEn}`}
              </h2>
              <p className="text-xs text-[#526574] mt-1">
                {localizedText(isAr ? 'ar' : 'en', 'text_de7356d54d')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setDentistEmail('ANY')}
                className={`p-5 rounded-2xl border-2 text-start transition-all ${
                  dentistEmail === 'ANY'
                    ? 'border-[#176C5B] bg-[#EAF3FF]/60'
                    : 'border-[#D8E0DC] bg-[#F7F8F5]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#176C5B] text-white flex items-center justify-center mb-3">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#163447]">
                  {localizedText(isAr ? 'ar' : 'en', 'text_4d97b69e96')}
                </h3>
                <p className="text-xs text-[#526574] mt-1">
                  {localizedText(isAr ? 'ar' : 'en', 'text_4170deea98')}
                </p>
              </button>

              {branchDentists.map((doc) => {
                const selected = dentistEmail === doc.email;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setDentistEmail(doc.email)}
                    className={`p-5 rounded-2xl border-2 text-start transition-all ${
                      selected
                        ? 'border-[#176C5B] bg-[#EAF3FF]/60'
                        : 'border-[#D8E0DC] bg-[#F7F8F5]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#163447] text-white font-bold text-xs flex items-center justify-center mb-3">
                      {doc.nameEn
                        .replace('Dr. ', '')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <h3 className="text-base font-bold text-[#163447]">
                      {isAr ? doc.nameAr : doc.nameEn}
                    </h3>
                    <p className="text-xs font-semibold text-[#176C5B] mt-0.5">
                      {isAr ? doc.specialtyAr : doc.specialtyEn}
                    </p>
                    <p className="text-xs text-[#526574] mt-2">
                      {isAr ? doc.scheduleSummaryAr : doc.scheduleSummaryEn}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(2)}>
                {localizedText(isAr ? 'ar' : 'en', 'text_b8a04f348b')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(4)}
                icon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {localizedText(isAr ? 'ar' : 'en', 'text_b5db3472db')}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: CHOOSE DATE & AVAILABLE TIME SLOT */}
        {step === 4 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#163447]">
                  {localizedText(isAr ? 'ar' : 'en', 'text_ac91ea3d22')}
                </h2>
                <p className="text-xs text-[#526574] mt-1">
                  {localizedText(isAr ? 'ar' : 'en', 'text_f3d5b234ef')}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#163447] mb-1">
                  {localizedText(isAr ? 'ar' : 'en', 'text_5d2f4b0480')}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3.5 py-2 text-xs font-bold text-[#163447] focus:border-[#176C5B] focus:outline-none"
                />
              </div>
            </div>

            {!loadingSlots && slots.length === 0 && <p role="status">{localizedText(isAr ? 'ar' : 'en', 'text_664ee6d3a5')}</p>}
            {loadingSlots ? (
              <div className="py-10 text-center text-xs text-[#526574]">
                {localizedText(isAr ? 'ar' : 'en', 'text_de46afcc52')}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {slots.map((slot) => {
                  const isSelected = selectedSlot.time === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        !slot.available
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-[#176C5B] border-[#176C5B] text-white shadow-sm'
                          : 'bg-[#F7F8F5] border-[#D8E0DC] text-[#163447] hover:border-[#176C5B]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{slot.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(3)}>
                {localizedText(isAr ? 'ar' : 'en', 'text_b8a04f348b')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                disabled={loadingSlots || !selectedSlot.available}
                onClick={() => setStep(5)}
                icon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {localizedText(isAr ? 'ar' : 'en', 'text_83b887ba13')}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: PATIENT DETAILS */}
        {step === 5 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#163447]">
                {localizedText(isAr ? 'ar' : 'en', 'text_74a2a477e9')}
              </h2>
              <p className="text-xs text-[#526574] mt-1">
                {localizedText(isAr ? 'ar' : 'en', 'text_7beb93a482')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPatientType('NEW')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                  patientType === 'NEW'
                    ? 'bg-[#176C5B] text-white border-[#176C5B]'
                    : 'bg-[#F7F8F5] text-[#163447] border-[#D8E0DC]'
                }`}
              >
                {localizedText(isAr ? 'ar' : 'en', 'text_0100256c83')}
              </button>
              <button
                type="button"
                onClick={() => setPatientType('RETURNING')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                  patientType === 'RETURNING'
                    ? 'bg-[#176C5B] text-white border-[#176C5B]'
                    : 'bg-[#F7F8F5] text-[#163447] border-[#D8E0DC]'
                }`}
              >
                {localizedText(isAr ? 'ar' : 'en', 'text_97d01268c1')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#163447] mb-1.5">
                  {localizedText(isAr ? 'ar' : 'en', 'text_42c57fafbd')}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={localizedText(isAr ? 'ar' : 'en', 'text_e0830762a7')}
                  className="w-full rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3.5 py-2.5 text-xs text-[#163447] focus:border-[#176C5B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163447] mb-1.5">
                  {localizedText(isAr ? 'ar' : 'en', 'text_ef49df733d')}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 10 1234 5678"
                  className="w-full rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3.5 py-2.5 text-xs text-[#163447] focus:border-[#176C5B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163447] mb-1.5">
                  {localizedText(isAr ? 'ar' : 'en', 'text_99ef601bb9')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3.5 py-2.5 text-xs text-[#163447] focus:border-[#176C5B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163447] mb-1.5">
                  {localizedText(isAr ? 'ar' : 'en', 'text_cac9493ab5')}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3.5 py-2.5 text-xs text-[#163447] focus:border-[#176C5B] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#163447] mb-1.5">
                {localizedText(isAr ? 'ar' : 'en', 'text_f6e3e5c590')}
              </label>
              <textarea
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={
                  localizedText(isAr ? 'ar' : 'en', 'text_3d7a0c19f2')
                }
                className="w-full rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3.5 py-2.5 text-xs text-[#163447] focus:border-[#176C5B] focus:outline-none"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 text-xs text-[#163447] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMedicalAlert}
                  onChange={(e) => setHasMedicalAlert(e.target.checked)}
                  className="rounded border-[#D8E0DC] text-[#176C5B] focus:ring-[#176C5B]"
                />
                <span>
                  {localizedText(isAr ? 'ar' : 'en', 'text_d03e8886a5')}
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-[#526574] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="rounded border-[#D8E0DC] text-[#176C5B] focus:ring-[#176C5B]"
                />
                <span>
                  {localizedText(isAr ? 'ar' : 'en', 'text_cc5b7f9ddf')}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(4)}>
                {localizedText(isAr ? 'ar' : 'en', 'text_b8a04f348b')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (!fullName.trim() || !phone.trim()) {
                    setError(
                      localizedText(isAr ? 'ar' : 'en', 'text_3d69f115be')
                    );
                    return;
                  }
                  setError(null);
                  setStep(6);
                }}
                icon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {localizedText(isAr ? 'ar' : 'en', 'text_86fba6f62a')}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: BOOKING SUMMARY & POLICY REVIEW */}
        {step === 6 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#163447]">
                {localizedText(isAr ? 'ar' : 'en', 'text_1fca0a1d71')}
              </h2>
              <p className="text-xs text-[#526574] mt-1">
                {localizedText(isAr ? 'ar' : 'en', 'text_7a7aa63618')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#F7F8F5] border border-[#D8E0DC] text-xs">
              <div className="space-y-2">
                <div>
                  <span className="text-[#526574] block">{localizedText(isAr ? 'ar' : 'en', 'text_c8ae26e8c3')}</span>
                  <strong className="text-sm text-[#163447]">
                    {isAr ? selectedBranchObj.nameAr : selectedBranchObj.nameEn}
                  </strong>
                </div>
                <div>
                  <span className="text-[#526574] block">
                    {localizedText(isAr ? 'ar' : 'en', 'text_ebdf17a454')}
                  </span>
                  <strong className="text-sm text-[#163447]">
                    {serviceSlug === 'unsure'
                      ? localizedText(isAr ? 'ar' : 'en', 'text_da54b6092c')
                      : isAr
                      ? selectedServiceObj.nameAr
                      : selectedServiceObj.nameEn}
                  </strong>
                </div>
                <div>
                  <span className="text-[#526574] block">{localizedText(isAr ? 'ar' : 'en', 'text_af764fa7a3')}</span>
                  <strong className="text-sm text-[#163447]">
                    {selectedDentistObj
                      ? isAr
                        ? selectedDentistObj.nameAr
                        : selectedDentistObj.nameEn
                      : localizedText(isAr ? 'ar' : 'en', 'text_18ab258869')}
                  </strong>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[#526574] block">
                    {localizedText(isAr ? 'ar' : 'en', 'text_85a73e81b5')}
                  </span>
                  <strong className="text-sm text-[#176C5B]">
                    {selectedDate} • {selectedSlot.label} ({selectedSlot.window})
                  </strong>
                </div>
                <div>
                  <span className="text-[#526574] block">{localizedText(isAr ? 'ar' : 'en', 'text_7350f31ec0')}</span>
                  <strong className="text-sm text-[#163447]">
                    {fullName} ({phone})
                  </strong>
                </div>
                <div>
                  <span className="text-[#526574] block">
                    {localizedText(isAr ? 'ar' : 'en', 'text_db0964a55c')}
                  </span>
                  <strong className="text-sm text-[#163447] tabular-nums">
                    EGP{' '}
                    {serviceSlug === 'unsure'
                      ? '400'
                      : selectedServiceObj.startingPriceEgp.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(5)}>
                {localizedText(isAr ? 'ar' : 'en', 'text_34afd65b1d')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                isLoading={submitting}
                onClick={handleSubmitBooking}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {localizedText(isAr ? 'ar' : 'en', 'text_e14597df31')}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 8: CONFIRMATION SCREEN */}
        {step === 8 && (
          <div className="bg-white rounded-3xl border-2 border-[#176C5B] p-8 shadow-lg space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF3FF] text-[#176C5B] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#176C5B]">
                  {localizedText(isAr ? 'ar' : 'en', 'text_c7d81e9523')}
                </span>
                <h2 className="text-2xl font-extrabold text-[#163447]">
                  {isAr
                    ? `شكراً لك، ${fullName}!`
                    : `Thank You, ${fullName}! Your Visit Request Is Logged.`}
                </h2>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F8F5] border border-[#D8E0DC] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#526574] block">
                  {localizedText(isAr ? 'ar' : 'en', 'text_476b6f58aa')}
                </span>
                <strong className="text-base font-mono text-[#176C5B]">
                  {bookingRef}
                </strong>
              </div>
              <div>
                <span className="text-[#526574] block">
                  {localizedText(isAr ? 'ar' : 'en', 'text_9a35d3edf8')}
                </span>
                <strong className="text-sm text-[#163447]">
                  {isAr ? selectedBranchObj.nameAr : selectedBranchObj.nameEn}
                </strong>
              </div>
              <div>
                <span className="text-[#526574] block">
                  {localizedText(isAr ? 'ar' : 'en', 'text_02bbcbe755')}
                </span>
                <strong className="text-sm text-[#163447]">
                  {selectedDate} • {selectedSlot.label}
                </strong>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="px-4 py-2.5 rounded-xl bg-[#163447] hover:bg-[#176C5B] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{localizedText(isAr ? 'ar' : 'en', 'text_0ee2d59f5f')}</span>
              </button>

              <a
                href={selectedBranchObj.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#F7F8F5] border border-[#D8E0DC] text-[#163447] hover:border-[#176C5B] text-xs font-bold inline-flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{localizedText(isAr ? 'ar' : 'en', 'text_1ad6656579')}</span>
              </a>

              <Link
                href="/portal/intake"
                className="px-4 py-2.5 rounded-xl bg-[#EAF3FF] text-[#176C5B] text-xs font-bold inline-flex items-center gap-2"
              >
                <span>
                  {localizedText(isAr ? 'ar' : 'en', 'text_8a96a541ee')}
                </span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm">Loading booking flow...</div>}>
      <BookingFlowContent />
    </Suspense>
  );
}
