'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Phone, MapPin, Calendar, ArrowUpRight, Languages } from 'lucide-react';
import { BrandLogo } from './ui/BrandLogo';

const WORKSPACE_PREFIXES = [
  '/portal',
  '/reception',
  '/dentist',
  '/management',
  '/billing',
  '/inventory',
  '/purchasing',
  '/operations',
  '/crm',
  '/admin',
  '/supplier',
];

export function Footer() {
  const { locale, setLocale, t } = useLanguage();
  const pathname = usePathname() || '/';
  const isAr = locale === 'ar';

  const isWorkspaceRoute = WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isWorkspaceRoute) {
    return (
      <footer
        className="bg-[#123B67] text-slate-300 border-t border-white/10 py-3 text-[11px]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1F6FB2]" />
            <span className="font-mono text-white font-semibold">Ebtesamty Clinical & Operational Platform</span>
            <span>•</span>
            <span>{isAr ? 'منصة ابتسامتي التشغيلية' : 'Authorized workspace'}</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Africa/Cairo • EGP</span>
            {process.env.NODE_ENV !== 'production' && (
              <Link href="/demo" className="text-[#F28C28] hover:underline font-semibold">
                {isAr ? 'حسابات العرض التجريبية' : 'Demo Accounts (Dev Only)'}
              </Link>
            )}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="bg-[#123B67] text-[#F6F8FC] border-t border-[#1F6FB2]/30 pt-14 pb-20 md:pb-12 transition-colors"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Final Call to Action Banner */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-[#1F6FB2] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-[#EAF3FF]">
              {isAr ? 'احجز زيارتك في ٣ فروع بالقاهرة' : 'Book Across 3 Cairo Branches'}
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold">
              {isAr
                ? 'ابتسامة صحية تبدأ بالرعاية الصحيحة والتشخيص الدقيق.'
                : 'A Healthier Smile Starts with the Right Care.'}
            </h3>
            <p className="text-xs sm:text-sm text-[#EAF3FF]/90">
              {isAr
                ? 'اختر الفرع المناسب لك، التخصص المطلوب، والموعد المتاح فعلياً في جدول أطبائنا.'
                : 'Select your preferred Cairo branch, dental specialty, and live verified appointment slot.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-[#123B67] hover:bg-[#EAF3FF] text-xs font-bold transition-colors shadow-sm"
            >
              <Calendar className="w-4 h-4 text-[#1F6FB2]" />
              <span>{isAr ? 'احجز موعداً الآن' : 'Book an Appointment'}</span>
            </Link>
            <Link
              href="/emergency"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-full border border-white/30 text-white hover:bg-white/10 text-xs font-semibold transition-colors"
            >
              <span>{isAr ? 'طوارئ الأسنان' : 'Urgent Dental Care'}</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand & Purpose */}
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-block bg-white/95 px-3.5 py-2 rounded-2xl">
              <BrandLogo size="md" variant="full" isArabic={isAr} />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              {isAr
                ? 'رعاية أسنان متكاملة وموثوقة عبر ثلاثة فروع في القاهرة (مصر الجديدة، القاهرة الجديدة، المعادي) مع ملف طبي إلكتروني موحد وتسعير واضح بالجنيه المصري.'
                : 'Warm, transparent, evidence-based dental care across three Cairo branches (Heliopolis, New Cairo, Maadi) backed by a unified electronic patient record and clear EGP pricing.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-[#EAF3FF] rounded-full text-[11px] font-mono border border-white/15">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F28C28]" />
                <span>{isAr ? 'تعقيم قياسي وسجل طبي موحد' : 'Unified Multi-Branch Clinical Record'}</span>
              </span>
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full text-[11px] font-semibold transition-colors"
              >
                <Languages className="w-3.5 h-3.5 text-[#F28C28]" />
                <span>{locale === 'en' ? 'العربية (RTL)' : 'English (LTR)'}</span>
              </button>
            </div>
          </div>

          {/* Patient Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#F28C28]">
              {isAr ? 'روابط المريض' : 'Patient Guide'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link href="/services" className="hover:text-white transition-colors">{isAr ? 'دليل الخدمات العلاجية' : 'Services Directory'}</Link></li>
              <li><Link href="/dentists" className="hover:text-white transition-colors">{isAr ? 'أطباؤنا والتخصصات' : 'Our Dentists'}</Link></li>
              <li><Link href="/branches" className="hover:text-white transition-colors">{isAr ? 'الفروع والمواقع' : 'Our Branches'}</Link></li>
              <li><Link href="/new-patients" className="hover:text-white transition-colors">{isAr ? 'دليل المريض الجديد' : 'New Patient Guide'}</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">{isAr ? 'الأسعار وطرق الدفع' : 'Pricing & Payments'}</Link></li>
              <li><Link href="/emergency" className="hover:text-white transition-colors">{isAr ? 'طوارئ الأسنان' : 'Emergency Dental Info'}</Link></li>
              <li><Link href="/education" className="hover:text-white transition-colors">{isAr ? 'التثقيف الصحي' : 'Patient Education'}</Link></li>
              <li><Link href="/faqs" className="hover:text-white transition-colors">{isAr ? 'الأسئلة الشائعة' : 'FAQs'}</Link></li>
            </ul>
          </div>

          {/* Portals & Workspaces */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#F28C28]">
              {isAr ? 'البوابات ولوحات التحكم' : 'Portals & Workspaces'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/portal" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{isAr ? 'بوابة المريض' : 'Patient Portal'}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/reception" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{isAr ? 'لوحة الاستقبال' : 'Receptionist Desk'}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/dentist" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{isAr ? 'مساحة الطبيب' : 'Dentist Workspace'}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/management" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{isAr ? 'الإدارة التنفيذية' : 'Owner / Executive'}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/billing" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{isAr ? 'المالية والحسابات' : 'Finance & Accounting'}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/inventory" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{isAr ? 'المخزون والمشتريات' : 'Inventory & Procurement'}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/crm" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{isAr ? 'التسويق وعلاقات المرضى' : 'Marketing, CRM & Retention'}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{isAr ? 'إدارة النظام' : 'Super Admin / Config'}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/demo" className="text-[#F28C28] hover:underline font-semibold">
                  {isAr ? 'مبدل الحسابات التجريبية' : 'Demo Role Switcher'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Cairo Branches Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#F28C28]">
              {isAr ? 'فروع القاهرة الثلاثة' : 'Cairo Branches'}
            </h4>
            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <Link href="/branches/BR-A" className="font-semibold text-white hover:text-[#EAF3FF] block">
                  {isAr ? 'الفرع أ • مصر الجديدة' : 'BR-A • Heliopolis'}
                </Link>
                <p className="text-[11px] text-slate-400">14 Baghdad St, Korba, Cairo</p>
                <p className="font-mono text-[11px] text-[#F28C28] tabular-nums">+20 2 2410 0001</p>
              </div>
              <div>
                <Link href="/branches/BR-B" className="font-semibold text-white hover:text-[#EAF3FF] block">
                  {isAr ? 'الفرع ب • القاهرة الجديدة' : 'BR-B • New Cairo'}
                </Link>
                <p className="text-[11px] text-slate-400">North 90th St, 5th Settlement</p>
                <p className="font-mono text-[11px] text-[#F28C28] tabular-nums">+20 2 2810 0002</p>
              </div>
              <div>
                <Link href="/branches/BR-C" className="font-semibold text-white hover:text-[#EAF3FF] block">
                  {isAr ? 'الفرع ج • المعادي' : 'BR-C • Maadi'}
                </Link>
                <p className="text-[11px] text-slate-400">Road 9, Maadi, Cairo</p>
                <p className="font-mono text-[11px] text-[#F28C28] tabular-nums">+20 2 2510 0003</p>
              </div>
            </div>
          </div>
        </div>

        {/* Policies, Accessibility & Fictional Demo Notice */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/policies" className="hover:text-white underline-offset-4 hover:underline">
              {isAr ? 'إشعار الخصوصية' : 'Privacy Notice'}
            </Link>
            <Link href="/policies#terms" className="hover:text-white underline-offset-4 hover:underline">
              {isAr ? 'شروط الحجز والإلغاء' : 'Booking & Cancellation Terms'}
            </Link>
            <Link href="/policies#accessibility" className="hover:text-white underline-offset-4 hover:underline">
              {isAr ? 'إمكانية الوصول (WCAG 2.2 AA)' : 'Accessibility Statement'}
            </Link>
            <Link href="/contact" className="hover:text-white underline-offset-4 hover:underline">
              {isAr ? 'تواصل معنا' : 'Contact Us'}
            </Link>
          </div>

          <p className="font-mono text-[11px] text-slate-400">
            © {new Date().getFullYear()} Ebtesamty Dental Clinics (ابتسامتي). Fictional Demo Environment • EGP • Africa/Cairo.
          </p>
        </div>
      </div>
    </footer>
  );
}
