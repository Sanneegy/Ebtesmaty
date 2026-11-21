'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { CLINIC_BRANCHES } from '../../config/clinic-catalog';
import { Button } from '../../components/ui/Button';
import {
  AlertTriangle,
  Phone,
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Activity,
  AlertCircle,
  Building2
} from 'lucide-react';

export default function EmergencyDentalPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="bg-[#F6F8FC] min-h-screen py-10 lg:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Urgent High-Contrast Header */}
        <div className="bg-[#123B67] text-white rounded-3xl p-8 sm:p-10 space-y-5 shadow-lg border border-[#123B67]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>
              {isAr
                ? 'توجيه طوارئ الأسنان — التنسيق الهاتفي العاجل'
                : 'Urgent Dental Care & Triage Routing (Cairo)'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isAr
              ? 'خدمة طوارئ الأسنان وتسكين الألم الحاد'
              : 'Same-Day Dental Emergency & Urgent Care'}
          </h1>

          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            {isAr
              ? 'تخصص عيادات ابتسامتي فترات طوارئ يومية مخصصة لفحص الحالات الحادة (الخراج، خلع الأسنان الصدمي، والألم الشديد غير المحتمل) مع توجيه هاتفي فوري لأقرب فرع مفتوح.'
              : 'Ebtesamty clinics maintain daily emergency buffer slots across Heliopolis, New Cairo, and Maadi to provide prompt pain relief, trauma stabilization, and clinical triage.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/book?service=emergency-dental-care">
              <Button variant="primary" size="lg" icon={<Calendar className="w-4 h-4" />}>
                {isAr ? 'حجز موعد طوارئ متاح' : 'Reserve Emergency Buffer Slot'}
              </Button>
            </Link>
            <a
              href="tel:+20224150001"
              className="px-5 py-3 rounded-xl bg-white text-[#123B67] text-xs font-bold hover:bg-[#EAF3FF] transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <Phone className="w-4 h-4 text-[#1F6FB2]" />
              <span>{isAr ? 'اتصل بمكتب الطوارئ المركزي: +20 2 2415 0001' : 'Call Urgent Dispatch: +20 2 2415 0001'}</span>
            </a>
          </div>
        </div>

        {/* Life-Threatening Safety Notice & Disclaimer */}
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-3.5 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm font-bold text-rose-900">
              {isAr ? 'تنبيه طبي وقانوني هام — الحالات المهددة للحياة:' : 'Clinical Safety Notice & Legal Triage Boundary:'}
            </strong>
            <p className="text-xs text-rose-800 leading-relaxed">
              {isAr
                ? 'هذه الصفحة مخصصة للتوجيه المكتبي لحالات الأسنان ولا تقدم تشخيصاً ذاتياً أو استجابة إسعافية آلية. إذا كنت تعاني من صعوبة حادة في التنفس أو البلع، تورم سريع ينتشر باتجاه الرقبة أو العين، نزيف لا يتوقف بعد ضغط مستمر، أو كسر في عظام الوجه والفكين، توجه فوراً إلى أقرب مستشفى طوارئ أو اتصل بالإسعاف المصري (123).'
                : 'This page provides telephone contact routing and first-aid instructions; it does not perform autonomous diagnosis or guarantee emergency ambulance dispatch. For airway obstruction, rapid facial swelling impeding swallowing or breathing, uncontrolled haemorrhage, or facial fractures, proceed immediately to the nearest general hospital emergency department or dial Egypt Ambulance (123).'}
            </p>
          </div>
        </div>

        {/* Urgent vs Non-Urgent Triage Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Urgent / Same-Day Column */}
          <div className="bg-white rounded-3xl border border-rose-200 p-6 sm:p-7 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
              <h2 className="text-base font-bold text-[#123B67]">
                {isAr ? 'حالات تتطلب رعاية في نفس اليوم' : 'Urgent Cases (Require Same-Day Visit)'}
              </h2>
            </div>
            <ul className="space-y-2.5 text-xs text-[#526574]">
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span><strong className="text-[#123B67]">{isAr ? 'ألم حاد نابض:' : 'Severe Unbearable Toothache:'}</strong> {isAr ? 'ألم يمنع النوم ولا يستجيب للمسكنات المعتادة.' : 'Persistent throbbing pain disturbing sleep and unresponsive to OTC analgesics.'}</span>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span><strong className="text-[#123B67]">{isAr ? 'خلع كامل للسن (صدمة):' : 'Avulsed (Knocked-Out) Adult Tooth:'}</strong> {isAr ? 'يحتاج إعادة تثبيت خلال 60 دقيقة.' : 'Re-implantation prognosis is optimal when seen within 60 minutes.'}</span>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span><strong className="text-[#123B67]">{isAr ? 'خراج أو تورم لثوي حاد:' : 'Acute Dental Abscess & Facial Swelling:'}</strong> {isAr ? 'انتفاخ صديدي يتطلب تصريفاً ومضاداً حيوياً.' : 'Localized fluctuant swelling requiring clinical drainage and infection control.'}</span>
              </li>
            </ul>
          </div>

          {/* Non-Urgent / Routine Column */}
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-7 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#1F6FB2]" />
              <h2 className="text-base font-bold text-[#123B67]">
                {isAr ? 'حالات يفضل جدولتها بموعد منتظم' : 'Non-Urgent Cases (Standard Scheduling)'}
              </h2>
            </div>
            <ul className="space-y-2.5 text-xs text-[#526574]">
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F6F8FC] border border-[#D8E0DC]">
                <CheckCircle2 className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                <span><strong className="text-[#123B67]">{isAr ? 'سقوط حشوة أو تاج قديم:' : 'Lost Filling or Loose Crown (No Pain):'}</strong> {isAr ? 'يمكن حفظ السن وتحديد موعد خلال 48 ساعة.' : 'Preserve crown; schedule elective recementation within 48 hours.'}</span>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F6F8FC] border border-[#D8E0DC]">
                <CheckCircle2 className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                <span><strong className="text-[#123B67]">{isAr ? 'حساسية طفيفة للمشروبات الباردة:' : 'Mild Transient Cold Sensitivity:'}</strong> {isAr ? 'فحص روتيني للكشف عن انحسار اللثة أو التسوس السطحي.' : 'Routine dental hygiene examination to evaluate enamel wear.'}</span>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F6F8FC] border border-[#D8E0DC]">
                <CheckCircle2 className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                <span><strong className="text-[#123B67]">{isAr ? 'نزيف بسيط أثناء تفريش الأسنان:' : 'Gingival Bleeding on Flossing:'}</strong> {isAr ? 'علامة على التهاب اللثة تتطلب جلسة تنظيف مجدولة.' : 'Indicates early gingivitis; managed with scheduled ultrasonic scaling.'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Immediate First-Aid Action Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#123B67]">
            {isAr ? 'إرشادات الإسعافات الأولية لحين وصولك للعيادة' : 'First-Aid Action Protocol While En Route'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                titleEn: '1. Knocked-Out Adult Tooth',
                titleAr: '1. خلع السن الدائم بالكامل',
                guidanceEn: 'Handle only by the white crown. Do NOT scrape the root. Place tooth in cold milk or patient saliva. Reach the clinic within 60 minutes.',
                guidanceAr: 'أمسك السن من التاج الأبيض فقط وتجنب لمس أو حك الجذر. ضعه في كوب حليب بارد أو لعاب المريض وتوجه للعيادة خلال ساعة.',
              },
              {
                titleEn: '2. Severe Throbbing Ache',
                titleAr: '2. ألم الأسنان الحاد والمستمر',
                guidanceEn: 'Rinse with warm saltwater to clear debris. Take standard oral analgesics according to your physician guidance. NEVER place aspirin on gums.',
                guidanceAr: 'مضمض بماء دافئ وملح لتنظيف الفم. تناول المسكنات الفموية المعتادة. تجنب تماماً وضع أقراص الأسبرين على اللثة لتفادي الحروق الكيميائية.',
              },
              {
                titleEn: '3. Facial Swelling & Abscess',
                titleAr: '3. تورم الوجه وانتفاخ اللثة',
                guidanceEn: 'Apply a cold compress on the outer cheek for 15 minutes at a time. Do NOT apply hot packs and never attempt to lance or drain swelling.',
                guidanceAr: 'ضع كمادات باردة على الخد من الخارج لمدة 15 دقيقة. تجنب الكمادات الساخنة تماماً ولا تحاول فتح أو ثقب التورم بنفسك.',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-[#D8E0DC] p-6 space-y-2.5 shadow-xs"
              >
                <h3 className="text-sm font-bold text-[#123B67]">
                  {isAr ? card.titleAr : card.titleEn}
                </h3>
                <p className="text-xs text-[#526574] leading-relaxed">
                  {isAr ? card.guidanceAr : card.guidanceEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Direct Branch Emergency Hotlines */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8E0DC] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#123B67]">
                {isAr ? 'أرقام الطوارئ المباشرة لفروع القاهرة' : 'Branch Direct Emergency Reception Desks'}
              </h2>
              <p className="text-xs text-[#526574] mt-0.5">
                {isAr ? 'اتصل بالفرع الأقرب إليك للتنسيق الفوري قبل الحضور' : 'Call your nearest branch directly to alert the clinical team prior to arrival'}
              </p>
            </div>
            <span className="text-xs font-bold text-[#1F6FB2] bg-[#EAF3FF] px-3 py-1 rounded-lg">
              3 Cairo Branches
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {CLINIC_BRANCHES.map((b) => (
              <div
                key={b.code}
                className="p-5 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC] space-y-2 hover:border-[#1F6FB2] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white bg-[#123B67] px-2 py-0.5 rounded">
                    {b.code}
                  </span>
                  <span className="text-[11px] text-[#526574] font-medium">{b.operatoriesCount} Chairs</span>
                </div>

                <div className="text-sm font-bold text-[#123B67]">
                  {isAr ? b.nameAr : b.nameEn}
                </div>

                <div className="text-[11px] text-[#526574] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#1F6FB2]" />
                  <span>{isAr ? b.hoursAr : b.hoursEn}</span>
                </div>

                <a
                  href={`tel:${b.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F6FB2] hover:underline pt-2 border-t border-[#D8E0DC]/60 w-full"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Direct Hotline: {b.phone}</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
