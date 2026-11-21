'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CLINIC_BRANCHES } from '../../config/clinic-catalog';
import { Button } from '../../components/ui/Button';
import {
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

export default function ContactPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [branchCode, setBranchCode] = useState('BR-A');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName,
          contactPhone,
          contactEmail,
          branchCode,
          category: 'INQUIRY',
          subject: subject || 'Website Inquiry',
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry');
      setSubmittedRef(data.feedback?.id?.slice(0, 8).toUpperCase() || 'INQ-2026');
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setSubject('');
      setDescription('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F6F8FC] min-h-screen py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] text-[#1F6FB2] text-xs font-bold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isAr ? 'تواصل مع عيادات ابتسامتي' : 'Contact & Patient Support'}</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#123B67]">
            {isAr ? 'نحن هنا للإجابة على استفساراتك' : 'Get in Touch With Our Cairo Branches'}
          </h1>
          <p className="text-sm text-[#526574] leading-relaxed">
            {isAr
              ? 'تواصل مباشرة مع الفرع الأقرب إليك هاتفياً أو أرسل استفسارك ليتم الرد عليك من فريق تنسيق المرضى.'
              : 'Call any of our 3 Cairo branches directly or send an online inquiry directly to our Patient Coordination & CRM desk.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#123B67] mb-2">
              {isAr ? 'أرسل استفساراً أو رسالة' : 'Send an Online Inquiry'}
            </h2>
            <p className="text-xs text-[#526574] mb-6">
              {isAr
                ? 'يتم تسجيل استفسارك مباشرة في نظام خدمة المرضى للرد عليك خلال ساعات العمل.'
                : 'Your inquiry is logged directly in our clinic CRM pipeline for prompt follow-up.'}
            </p>

            {submittedRef ? (
              <div className="p-6 rounded-2xl bg-[#EAF3FF] border border-[#1F6FB2]/30 space-y-3">
                <div className="flex items-center gap-2 text-[#1F6FB2] font-bold text-base">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {isAr
                      ? 'تم استلام رسالتك بنجاح!'
                      : 'Your Inquiry Has Been Received!'}
                  </span>
                </div>
                <p className="text-xs text-[#123B67]">
                  {isAr
                    ? `رقم المتابعة: #${submittedRef} — سيتواصل معك مكتب الاستقبال قريباً.`
                    : `Reference ID: #${submittedRef} — Our patient coordination desk will contact you shortly.`}
                </p>
                <Button variant="outline" size="sm" onClick={() => setSubmittedRef(null)}>
                  {isAr ? 'إرسال استفسار آخر' : 'Send Another Message'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                      {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={isAr ? 'الاسم ثلاثي' : 'Your full name'}
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
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+20 10 ..."
                      className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                      {isAr ? 'البريد الإلكتروني (اختياري)' : 'Email Address (Optional)'}
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                      {isAr ? 'الفرع المفضل' : 'Preferred Branch'}
                    </label>
                    <select
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs font-semibold text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                    >
                      {CLINIC_BRANCHES.map((b) => (
                        <option key={b.code} value={b.code}>
                          {isAr ? b.nameAr : b.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                    {isAr ? 'موضوع الرسالة *' : 'Subject *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال: استفسار عن تكلفة زراعة الأسنان'
                        : 'e.g., Question about Dental Implant consultation'
                    }
                    className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                    {isAr ? 'تفاصيل الاستفسار *' : 'Message Details *'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اكتب رسالتك هنا (يرجى عدم إدخال تفاصيل طبية حساسة في النموذج العام)...'
                        : 'Write your question here...'
                    }
                    className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={submitting}
                  icon={<Send className="w-4 h-4" />}
                >
                  {isAr ? 'إرسال الاستفسار' : 'Submit Inquiry'}
                </Button>
              </form>
            )}
          </div>

          {/* Direct Branch Cards with Facility Photos */}
          <div className="lg:col-span-5 space-y-5">
            {CLINIC_BRANCHES.map((b) => {
              const branchImage =
                b.code === 'BR-A'
                  ? '/images/branches/branch_heliopolis.jpg'
                  : b.code === 'BR-B'
                  ? '/images/branches/branch_new_cairo.jpg'
                  : '/images/branches/branch_maadi.jpg';

              return (
                <div
                  key={b.code}
                  className="bg-white rounded-3xl border border-[#D8E0DC] overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="relative h-36 w-full overflow-hidden bg-[#123B67]">
                    <img
                      src={branchImage}
                      alt={isAr ? b.nameAr : b.nameEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#123B67]/90 via-[#123B67]/30 to-transparent" />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#1F6FB2] text-white shadow-sm">
                        {b.code}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-[#123B67] backdrop-blur-xs">
                        {isAr ? b.shortNameAr : b.shortNameEn}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-base font-extrabold text-white">
                        {isAr ? b.nameAr : b.nameEn}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <p className="text-xs text-[#526574] flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                      <span>{isAr ? b.addressAr : b.addressEn}</span>
                    </p>
                    <p className="text-xs text-[#526574] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1F6FB2] shrink-0" />
                      <span>{isAr ? b.hoursAr : b.hoursEn}</span>
                    </p>

                    <div className="pt-2 border-t border-[#E8ECE9] flex flex-wrap gap-2">
                      <a
                        href={`tel:${b.phone}`}
                        className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1F6FB2] hover:bg-[#13558C] text-white text-xs font-bold transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{b.phone}</span>
                      </a>
                      <a
                        href={`https://wa.me/201001234567?text=${encodeURIComponent(
                          `Hello Ebtesamty Clinic (${b.code}), I would like to inquire about an appointment.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#EAF3FF] hover:bg-[#c9e4d9] text-[#1F6FB2] text-xs font-bold transition-colors"
                      >
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
