'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';
import { CLINIC_BRANCHES, CLINIC_SERVICES } from '../../../config/clinic-catalog';
import { Button } from '../../../components/ui/Button';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function AppointmentRequestPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [branchCode, setBranchCode] = useState('BR-A');
  const [serviceSlug, setServiceSlug] = useState('dental-checkups-consultations');
  const [urgency, setUrgency] = useState<'ROUTINE' | 'MODERATE' | 'URGENT'>('ROUTINE');
  const [preferredWindow, setPreferredWindow] = useState<'MORNING' | 'AFTERNOON' | 'EVENING'>('MORNING');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const selectedService = CLINIC_SERVICES.find((s) => s.slug === serviceSlug);
      const res = await fetch('/api/scheduling/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          branchCode,
          serviceName: selectedService ? (isAr ? selectedService.nameAr : selectedService.nameEn) : serviceSlug,
          preferredTimeWindow: preferredWindow,
          urgency,
          reason: notes || `Fast-track appointment triage (${urgency})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit appointment request');
      }

      setSubmittedRef(
        (data.trackingCode || data.request?.id || '').slice(0, 8).toUpperCase() || 'REQ-2026'
      );
    } catch (err: any) {
      setError(err.message || 'Error submitting request. Please call our reception.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F6F8FC] min-h-screen py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] text-[#1F6FB2] text-xs font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{isAr ? 'حجز موعد سريع' : 'Fast-Track Appointment Request'}</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#123B67]">
            {isAr ? 'طلب موعد أو استشارة سريرية' : 'Request a Clinical Consultation'}
          </h1>
          <p className="text-sm text-[#526574] leading-relaxed">
            {isAr
              ? 'أرسل تفاصيل طلبك وسيقوم فريق الاستقبال بالتواصل معك هاتفياً أو عبر واتساب خلال 30 دقيقة لتأكيد الموعد المناسب.'
              : 'Submit your preferred clinic and time window. Our reception coordination desk will call or WhatsApp within 30 minutes to confirm your slot.'}
          </p>
        </div>

        {/* Alternative Link to Full Self-Service Wizard */}
        <div className="p-4 rounded-2xl bg-white border border-[#D8E0DC] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF3FF] text-[#1F6FB2] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#123B67]">
                {isAr ? 'ترغب في اختيار طبيب ووقت محدد بنفسك؟' : 'Prefer to pick your exact dentist and real-time operatory slot?'}
              </div>
              <div className="text-[11px] text-[#526574]">
                {isAr ? 'استخدم نظام الحجز التفاعلي المباشر' : 'Use our 8-step live self-service booking flow'}
              </div>
            </div>
          </div>
          <Link href="/book">
            <Button variant="outline" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              {isAr ? 'الحجز الذاتي الفوري' : 'Live Booking Wizard'}
            </Button>
          </Link>
        </div>

        {/* Form or Confirmation */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-10 shadow-sm">
          {submittedRef ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#EAF3FF] text-[#1F6FB2] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#123B67]">
                {isAr ? 'تم استلام طلبك بنجاح!' : 'Your Request Has Been Received!'}
              </h2>
              <p className="text-xs text-[#526574] max-w-md mx-auto leading-relaxed">
                {isAr
                  ? `رقم الطلب الخاص بك هو #${submittedRef}. يقوم فريق الاستقبال في الفرع بمراجعة جدول الأطباء وسيتواصل معك قريباً.`
                  : `Your triage reference code is #${submittedRef}. Our reception team has queued your request and will contact you via WhatsApp / Phone to confirm your appointment.`}
              </p>

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <Link href="/">
                  <Button variant="outline" size="sm">
                    {isAr ? 'العودة للرئيسية' : 'Return Home'}
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSubmittedRef(null);
                    setFullName('');
                    setPhone('');
                    setNotes('');
                  }}
                >
                  {isAr ? 'إرسال طلب آخر' : 'Submit Another Request'}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Urgency Level Chips */}
              <div>
                <label className="block text-xs font-bold text-[#123B67] mb-2">
                  {isAr ? 'درجة الإلحاح أو سبب الزيارة' : 'Urgency Level / Nature of Visit'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setUrgency('ROUTINE')}
                    className={`p-3.5 rounded-2xl border text-start transition-all ${
                      urgency === 'ROUTINE'
                        ? 'border-[#1F6FB2] bg-[#EAF3FF] text-[#1F6FB2] font-bold'
                        : 'border-[#D8E0DC] bg-[#F6F8FC] text-[#526574] hover:bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{isAr ? 'كشف دوري / استشارة' : 'Routine Consultation'}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{isAr ? 'فحص، تنظيف، خطة علاج' : 'Checkup, clean, consultation'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('MODERATE')}
                    className={`p-3.5 rounded-2xl border text-start transition-all ${
                      urgency === 'MODERATE'
                        ? 'border-[#1F6FB2] bg-[#EAF3FF] text-[#1F6FB2] font-bold'
                        : 'border-[#D8E0DC] bg-[#F6F8FC] text-[#526574] hover:bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{isAr ? 'انزعاج أو ألم محتمل' : 'Discomfort / Pain'}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{isAr ? 'حساسية، حشو منكسر' : 'Toothache, broken filling'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('URGENT')}
                    className={`p-3.5 rounded-2xl border text-start transition-all ${
                      urgency === 'URGENT'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                        : 'border-[#D8E0DC] bg-[#F6F8FC] text-[#526574] hover:bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{isAr ? 'ألم حاد / طارئ' : 'Urgent Dental Care'}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{isAr ? 'ألم شديد، تورم، صدمة' : 'Severe pain, swelling, trauma'}</div>
                  </button>
                </div>
              </div>

              {/* Branch & Service */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                    {isAr ? 'الفرع المفضل *' : 'Preferred Branch *'}
                  </label>
                  <select
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs font-semibold text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                  >
                    {CLINIC_BRANCHES.map((b) => (
                      <option key={b.code} value={b.code}>
                        {isAr ? b.nameAr : b.nameEn} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                    {isAr ? 'الخدمة المطلوبة' : 'Dental Service'}
                  </label>
                  <select
                    value={serviceSlug}
                    onChange={(e) => setServiceSlug(e.target.value)}
                    className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs font-semibold text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                  >
                    {CLINIC_SERVICES.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {isAr ? s.nameAr : s.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                    {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isAr ? 'الاسم ثلاثي' : 'e.g., Hassan Ahmed'}
                    className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                    {isAr ? 'رقم الهاتف (مصر) *' : 'Mobile Phone (Egypt) *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 123 4567"
                    className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                  />
                </div>
              </div>

              {/* Time Window */}
              <div>
                <label className="block text-xs font-bold text-[#123B67] mb-2">
                  {isAr ? 'الفترة الزمنية المفضلة للتواصل أو الزيارة' : 'Preferred Appointment Window'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'MORNING', labelEn: 'Morning (10:00 - 14:00)', labelAr: 'صباحاً (10 - 2)' },
                    { id: 'AFTERNOON', labelEn: 'Afternoon (14:00 - 18:00)', labelAr: 'ظهراً (2 - 6)' },
                    { id: 'EVENING', labelEn: 'Evening (18:00 - 21:00)', labelAr: 'مساءً (6 - 9)' },
                  ].map((win) => (
                    <button
                      key={win.id}
                      type="button"
                      onClick={() => setPreferredWindow(win.id as any)}
                      className={`p-3 rounded-xl border text-center text-xs transition-all ${
                        preferredWindow === win.id
                          ? 'border-[#1F6FB2] bg-[#EAF3FF] text-[#1F6FB2] font-bold'
                          : 'border-[#D8E0DC] bg-[#F6F8FC] text-[#526574] hover:bg-white'
                      }`}
                    >
                      {isAr ? win.labelAr : win.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                  {isAr ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isAr
                      ? 'أي تفاصيل تساعد طبيب الاستقبال في توجيه حالتك بشكل أفضل...'
                      : 'Any specific requests or symptoms you would like to note...'
                  }
                  className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#EAF3FF] border border-[#1F6FB2]/20 flex items-start gap-2.5 text-xs text-[#1F6FB2]">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? 'بياناتك الشخصية محفوظة ومحمية تماماً ولا تستخدم إلا للتنسيق الطبي لحجز موعدك.'
                    : 'Your contact data is strictly used for clinical appointment coordination and is never shared.'}
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={submitting}
                className="w-full justify-center"
                icon={<Send className="w-4 h-4" />}
              >
                {isAr ? 'إرسال طلب الموعد السريع' : 'Submit Fast-Track Request'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
