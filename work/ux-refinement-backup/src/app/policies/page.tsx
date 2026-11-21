'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldCheck,
  Lock,
  Calendar,
  Eye,
  FileCheck2,
  DollarSign,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function PoliciesPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'privacy' | 'booking' | 'billing' | 'reviews' | 'accessibility'>('privacy');

  return (
    <div className="bg-[#F6F8FC] min-h-screen py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] text-[#1F6FB2] text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? 'الشفافية والسياسات المعتمدة' : 'Transparency & Clinic Policies'}</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#123B67]">
            {isAr
              ? 'سياسات العيادة، الخصوصية، وشروط المواعيد'
              : 'Clinical Integrity, Privacy & Patient Policies'}
          </h1>
          <p className="text-sm text-[#526574] leading-relaxed">
            {isAr
              ? 'تلتزم عيادات ابتسامتي بأعلى معايير الشفافية الطبية وحماية البيانات والنزاهة المالية في جميع الفروع.'
              : 'Ebtesamty Dental Clinics upholds the highest standards of clinical privacy, financial transparency, and verified patient care across all branches in Cairo.'}
          </p>
          <div className="text-xs font-semibold text-[#1F6FB2]">
            {isAr
              ? 'تاريخ التحديث: أكتوبر 2026 — معتمدة من الإدارة الطبية والتنفيذية'
              : 'Last Updated: October 2026 — Verified by Clinic Executive & Medical Directorate'}
          </div>
        </div>

        {/* Quick Nav Chips */}
        <div className="flex flex-wrap gap-2 border-b border-[#D8E0DC] pb-4">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'privacy'
                ? 'bg-[#1F6FB2] text-white shadow-xs'
                : 'bg-white text-[#526574] hover:bg-[#EAF3FF] border border-[#D8E0DC]'
            }`}
          >
            {isAr ? '1. حماية البيانات الطبية (PHI)' : '1. Medical Privacy (PHI)'}
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'booking'
                ? 'bg-[#1F6FB2] text-white shadow-xs'
                : 'bg-white text-[#526574] hover:bg-[#EAF3FF] border border-[#D8E0DC]'
            }`}
          >
            {isAr ? '2. المواعيد والإلغاء (24 ساعة)' : '2. Booking & Cancellation'}
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'billing'
                ? 'bg-[#1F6FB2] text-white shadow-xs'
                : 'bg-white text-[#526574] hover:bg-[#EAF3FF] border border-[#D8E0DC]'
            }`}
          >
            {isAr ? '3. النزاهة المالية والأسعار' : '3. Financial Transparency'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'reviews'
                ? 'bg-[#1F6FB2] text-white shadow-xs'
                : 'bg-white text-[#526574] hover:bg-[#EAF3FF] border border-[#D8E0DC]'
            }`}
          >
            {isAr ? '4. موثوقية الآراء والتقييمات' : '4. Zero-Fabrication Reviews'}
          </button>
          <button
            onClick={() => setActiveTab('accessibility')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'accessibility'
                ? 'bg-[#1F6FB2] text-white shadow-xs'
                : 'bg-white text-[#526574] hover:bg-[#EAF3FF] border border-[#D8E0DC]'
            }`}
          >
            {isAr ? '5. سهولة الوصول الرقمي والمكاني' : '5. Accessibility (WCAG 2.2)'}
          </button>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1: Privacy */}
          {(activeTab === 'privacy' || true) && (
            <div
              id="privacy"
              className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 space-y-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF3FF] text-[#1F6FB2] flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#123B67]">
                    {isAr
                      ? '1. حماية البيانات الطبية والخصوصية (PHI & Data Protection)'
                      : '1. Patient Privacy, Medical Records & PHI Security'}
                  </h2>
                  <p className="text-xs text-[#526574]">
                    {isAr ? 'إجراءات صارمة لحماية سرية المرضى وسجلات الأسنان' : 'Strict safeguards for odontograms, medical history, and clinical findings'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#E8ECE9] space-y-2">
                  <h3 className="text-sm font-bold text-[#123B67] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1F6FB2]" />
                    <span>{isAr ? 'التحكم بالصلاحيات بحسب الدور (RBAC)' : 'Role-Based Access Control (RBAC)'}</span>
                  </h3>
                  <p className="text-xs text-[#526574] leading-relaxed">
                    {isAr
                      ? 'لا يمكن لموظف الاستقبال أو المحاسب الاطلاع على الملاحظات السريرية أو التاريخ المرضي التفصيلي. الوصول الطبي مقتصر تماماً على الطبيب المعالج والمريض صاحب الحساب.'
                      : 'Receptionists and accountants cannot access clinical notes or full medical questionnaire responses. Clinical records are restricted solely to the treating dentist and the verified patient.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#E8ECE9] space-y-2">
                  <h3 className="text-sm font-bold text-[#123B67] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1F6FB2]" />
                    <span>{isAr ? 'سجلات تدقيق غير قابلة للتعديل' : 'Zero-PHI Immutable Audit Logs'}</span>
                  </h3>
                  <p className="text-xs text-[#526574] leading-relaxed">
                    {isAr
                      ? 'يتم تسجيل كل محاولة وصول أو تعديل لحالة موعد أو فاتورة في سجل تدقيق لا يمكن حذفه، مع حظر تسجيل أي معلومات طبية تشخيصية حرة في بيانات التدقيق لحماية الخصوصية.'
                      : 'Every access, appointment status change, and financial transaction is permanently logged. Free-text diagnostic findings are strictly barred from audit metadata to protect patient confidentiality.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Booking & Cancellation */}
          <div
            id="booking"
            className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 space-y-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF3FF] text-[#1F6FB2] flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#123B67]">
                  {isAr
                    ? '2. سياسة المواعيد، الإلغاء، وإعادة الجدولة (إشعار 24 ساعة)'
                    : '2. Appointment Scheduling, Cancellation & Rescheduling (24-Hour Policy)'}
                </h2>
                <p className="text-xs text-[#526574]">
                  {isAr ? 'إجراءات واضحة ومنصفة للحفاظ على وقت الأطباء والمرضى' : 'Fair and clear protocols respecting doctor time and patient convenience'}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-[#526574] leading-relaxed">
              <p>
                {isAr
                  ? '• يمكن تعديل أو إلغاء أي موعد بدون أي رسوم حتى قبل 24 ساعة من الموعد المحجوز عبر بوابة المريض أو بالاتصال بفرع العيادة.'
                  : '• Patients may reschedule or cancel any scheduled visit free of charge up to 24 hours prior to the appointment via the Patient Portal or phone call.'}
              </p>
              <p>
                {isAr
                  ? '• في حالة التأخر لأكثر من 15 دقيقة دون إخطار مسبق، قد يتم تقليص مدة الجلسة للحفاظ على مواعيد المرضى التاليين، أو التنسيق لموعد بديل.'
                  : '• If you arrive more than 15 minutes past your scheduled slot without prior notice, treatment time may be adjusted or deferred to protect following patients.'}
              </p>
              <p>
                {isAr
                  ? '• الحالات الطارئة للأسنان (ألم حاد، نزيف، كسر سن مفاجئ) تعطى الأولوية فوراً بالتنسيق مع طبيب الفرع المناوب.'
                  : '• Acute dental emergencies (severe throbbing pain, dental trauma, swelling) receive prioritized immediate triage upon clinical assessment.'}
              </p>
            </div>
          </div>

          {/* Section 3: Financial Transparency */}
          <div
            id="billing"
            className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 space-y-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF3FF] text-[#1F6FB2] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#123B67]">
                  {isAr
                    ? '3. الشفافية المالية، خطط الدفع، والإيصالات الضريبية'
                    : '3. Financial Transparency, Staged Milestone Care & Receipts'}
                </h2>
                <p className="text-xs text-[#526574]">
                  {isAr ? 'تسعير واضح بالجنيه المصري دون أي رسوم خفية' : 'Itemized EGP accounting, no unexpected surprise additions'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#E8ECE9] space-y-2">
                <div className="text-xs font-bold text-[#123B67]">
                  {isAr ? 'خطة علاج مكتوبة ومسبقة' : 'Written Treatment Estimates'}
                </div>
                <p className="text-xs text-[#526574]">
                  {isAr
                    ? 'يحصل المريض على تفنيد كامل لخطوات العلاج والتكلفة التقديرية بالجنيه المصري قبل البدء في أي إجراء معقد.'
                    : 'Every comprehensive treatment plan receives a phased cost breakdown in EGP before initiating irreversible restorative procedures.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#E8ECE9] space-y-2">
                <div className="text-xs font-bold text-[#123B67]">
                  {isAr ? 'دفع مرحلي بحسب الإنجاز' : 'Milestone Installments'}
                </div>
                <p className="text-xs text-[#526574]">
                  {isAr
                    ? 'الإجراءات متعددة الجلسات مثل زراعة الأسنان وتقويم الأسنان يتم سدادها على دفعات مرتبطة بمراحل الإنجاز السريري الفعلي.'
                    : 'Multi-stage procedures (implants, clear aligners) are billed in clear phases tied to clinical milestones (surgical placement, healing, final crown).'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#E8ECE9] space-y-2">
                <div className="text-xs font-bold text-[#123B67]">
                  {isAr ? 'وسائل دفع متعددة وإيصال فوري' : 'Flexible Payment Channels'}
                </div>
                <p className="text-xs text-[#526574]">
                  {isAr
                    ? 'نقبل الدفع النقدي، البطاقات البنكية، إنستاباي (InstaPay)، مع إصدار إيصال فوري مسجل على ملف المريض.'
                    : 'We accept Cash, Debit/Credit Cards, and InstaPay with immediate digitally reconciled receipts posted to your portal.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Verified Reviews */}
          <div
            id="reviews"
            className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 space-y-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF3FF] text-[#1F6FB2] flex items-center justify-center font-bold">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#123B67]">
                  {isAr
                    ? '4. سياسة موثوقية التقييمات (Zero-Fabrication Policy)'
                    : '4. Authentic Reviews & Zero-Fabrication Transparency'}
                </h2>
                <p className="text-xs text-[#526574]">
                  {isAr ? 'تقييمات حقيقية مرتبطة بزيارات عيادية فعلية مثبتة' : 'Only genuine patients with completed clinical encounters can submit reviews'}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#526574] leading-relaxed pt-2">
              {isAr
                ? 'تلتزم عيادات ابتسامتي بالنزاهة التامة في عرض آراء المرضى. لا نقوم باختلاق أو شراء أو نشر أي تقييمات مزيفة. جميع المراجعات المنشورة في بوابة المريض أو الموقع مصدرها استبيانات مقدمة من مرضى أتموا زيارات سريرية مسجلة في النظام.'
                : 'Ebtesamty enforces a zero-fabrication policy regarding testimonials. Reviews on our platform originate strictly from verified patients following completed clinic appointments. We do not invent, purchase, or manipulate patient feedback.'}
            </p>
          </div>

          {/* Section 5: Accessibility */}
          <div
            id="accessibility"
            className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 space-y-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF3FF] text-[#1F6FB2] flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#123B67]">
                  {isAr
                    ? '5. إمكانية الوصول الرقمي والمكاني (WCAG 2.2 AA & Physical Access)'
                    : '5. Digital & Physical Accessibility Commitment (WCAG 2.2 Level AA)'}
                </h2>
                <p className="text-xs text-[#526574]">
                  {isAr ? 'موقع سهل الاستخدام وعيادات مجهزة لجميع المرضى' : 'Inclusive web interface and wheelchair-accessible facilities in all branches'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#E8ECE9] space-y-2">
                <h3 className="text-xs font-bold text-[#123B67]">
                  {isAr ? 'معايير الوصول الرقمي للموقع' : 'Digital Platform Accessibility'}
                </h3>
                <ul className="text-xs text-[#526574] space-y-1.5 list-disc list-inside">
                  <li>{isAr ? 'توافق كامل مع قارئات الشاشة وعناصر ARIA' : 'Screen reader compatibility with semantic HTML and ARIA labels'}</li>
                  <li>{isAr ? 'نسبة تباين ألوان تفوق 4.5:1 للنصوص للقراءة المريحة' : 'Minimum 4.5:1 text-to-background contrast meeting WCAG AA'}</li>
                  <li>{isAr ? 'دعم كامل للتنقل عبر لوحة المفاتيح واللغة العربية (RTL)' : 'Complete keyboard navigability and native Arabic (RTL) typography'}</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#E8ECE9] space-y-2">
                <h3 className="text-xs font-bold text-[#123B67]">
                  {isAr ? 'التجهيزات الميدانية في الفروع' : 'Physical Clinic Accessibility'}
                </h3>
                <ul className="text-xs text-[#526574] space-y-1.5 list-disc list-inside">
                  <li>{isAr ? 'مداخل ممهدة ومصاعد تتسع للكراسي المتحركة في جميع الفروع' : 'Step-free ramp entrances and wheelchair-accessible elevators in Heliopolis, New Cairo, and Maadi'}</li>
                  <li>{isAr ? 'غرف علاج متسعة ومصممة لدخول الكراسي المتحركة بسهولة' : 'Spacious operatory suites allowing direct wheelchair transfer'}</li>
                  <li>{isAr ? 'فريق استقبال مدرّب لمساعدة كبار السن وذوي الإعاقة' : 'Trained reception staff to assist elderly patients and individuals with reduced mobility'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support CTA */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#123B67] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-start">
            <h3 className="text-lg font-bold">
              {isAr ? 'هل لديك أي استفسار حول سياسات العيادة؟' : 'Have a Question About Our Policies or Records?'}
            </h3>
            <p className="text-xs text-white/80">
              {isAr
                ? 'فريق إدارة شؤون المرضى جاهز للإجابة على جميع استفساراتك القانونية أو الطبية.'
                : 'Our Patient Relations & Compliance team is available to assist with any questions.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/contact">
              <Button variant="primary" size="md">
                {isAr ? 'تواصل معنا' : 'Contact Support Desk'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
