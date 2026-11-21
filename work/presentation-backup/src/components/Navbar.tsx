'use client';
import {localizedText} from '@/lib/interface-messages';


import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { AppointmentRequestModal } from './AppointmentRequestModal';
import { BrandLogo } from './ui/BrandLogo';
import {
  Calendar,
  LogOut,
  Languages,
  ShieldAlert,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Phone,
  MapPin,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

interface NavbarProps {
  currentUser?: {
    id: string;
    fullName: string;
    email?: string | null;
    roleGrants: { role: string; branch?: { code: string; name: string } | null }[];
  } | null;
}

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

export function Navbar({ currentUser }: NavbarProps) {
  const pathname = usePathname() || '/';
  const { t, locale, setLocale } = useLanguage();
  const isAr = locale === 'ar';
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'services' | 'branches' | 'resources' | null>(null);

  const primaryRole = currentUser?.roleGrants?.[0]?.role;

  const isWorkspaceRoute = WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

  const publicNavLinks = [
    { href: '/', label: localizedText(isAr ? 'ar' : 'en', 'text_a7e49d2ebd') },
    {
      href: '/services',
      label: localizedText(isAr ? 'ar' : 'en', 'text_2ffb83e078'),
      dropdownKey: 'services' as const,
      subItems: [
        { href: '/services/general-dentistry', labelEn: 'General & Preventive Care', labelAr: 'طب الأسنان العام والوقائي' },
        { href: '/services/dental-cleaning', labelEn: 'Dental Cleaning & Hygiene', labelAr: 'تنظيف الجير وتلميع الأسنان' },
        { href: '/services/restorative-fillings', labelEn: 'Fillings & Restorative Care', labelAr: 'الحشوات التجميلية والعلاج التحفظي' },
        { href: '/services/root-canal', labelEn: 'Root Canal Treatment (Endodontics)', labelAr: 'علاج الجذور المجهري' },
        { href: '/services/crowns-bridges', labelEn: 'Crowns & Bridges', labelAr: 'التركيبات الثابتة والتيجان' },
        { href: '/services/dental-implants', labelEn: 'Dental Implants & Oral Surgery', labelAr: 'زراعة الأسنان والجراحة' },
        { href: '/services/orthodontics', labelEn: 'Orthodontics & Clear Aligners', labelAr: 'تقويم الأسنان والتقويم الشفاف' },
        { href: '/services/cosmetic-dentistry', labelEn: 'Cosmetic Dentistry & Whitening', labelAr: 'تجميل الأسنان وتبييضها' },
      ],
    },
    { href: '/dentists', label: localizedText(isAr ? 'ar' : 'en', 'text_c441cc23f0') },
    {
      href: '/branches',
      label: localizedText(isAr ? 'ar' : 'en', 'text_d9c43f75f3'),
      dropdownKey: 'branches' as const,
      subItems: [
        { href: '/branches/BR-A', labelEn: 'Branch A — Heliopolis', labelAr: 'الفرع أ — مصر الجديدة' },
        { href: '/branches/BR-B', labelEn: 'Branch B — New Cairo', labelAr: 'الفرع ب — القاهرة الجديدة' },
        { href: '/branches/BR-C', labelEn: 'Branch C — Maadi', labelAr: 'الفرع ج — المعادي' },
        { href: '/branches', labelEn: 'Compare All 3 Branches', labelAr: 'مقارنة جميع الفروع الثلاثة' },
      ],
    },
    {
      href: '/new-patients',
      label: localizedText(isAr ? 'ar' : 'en', 'text_dc35fb600a'),
      dropdownKey: 'resources' as const,
      subItems: [
        { href: '/about', labelEn: 'About Ebtesamty & Sterilization', labelAr: 'عن ابتسامتي ومعايير التعقيم' },
        { href: '/new-patients', labelEn: 'New Patient Guide', labelAr: 'دليل المريض الجديد' },
        { href: '/pricing', labelEn: 'Pricing & Payment Options', labelAr: 'الأسعار وطرق الدفع' },
        { href: '/emergency', labelEn: 'Emergency Dental Care', labelAr: 'طوارئ الأسنان العاجلة' },
        { href: '/education', labelEn: 'Patient Education Library', labelAr: 'مكتبة التثقيف الصحي' },
        { href: '/faqs', labelEn: 'Frequently Asked Questions', labelAr: 'الأسئلة الشائعة' },
        { href: '/policies', labelEn: 'Privacy, Terms & Policies', labelAr: 'الخصوصية والشروط والسياسات' },
      ],
    },
    { href: '/contact', label: localizedText(isAr ? 'ar' : 'en', 'text_8b91476a98') },
  ];

  if (isWorkspaceRoute) {
    return null;
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-[#F7F8F5]/95 backdrop-blur-md border-b border-[#DDE5E1] transition-colors"
        dir={localizedText(isAr ? 'ar' : 'en', 'text_52b133b060')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="flex items-center gap-3 group">
                <BrandLogo size="md" variant="full" isArabic={isAr} />
              </Link>
            </div>

            {/* Desktop Public Navigation */}
            <nav
              aria-label="Global Public Navigation"
              className="hidden lg:flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-[#DDE5E1] shadow-2xs whitespace-nowrap"
            >
              {publicNavLinks.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(`${item.href}/`));

                if (item.dropdownKey && item.subItems) {
                  const isDropdownOpen = openDropdown === item.dropdownKey;
                  return (
                    <div
                      key={item.href}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.dropdownKey!)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <Link
                        href={item.href}
                        onFocus={() => setOpenDropdown(item.dropdownKey!)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                          isActive
                            ? 'text-white bg-[#176C5B] shadow-2xs'
                            : 'text-[#163447] hover:text-[#176C5B] hover:bg-[#EAF3FF]/60'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isDropdownOpen ? 'rotate-180 text-[#F28C28]' : ''
                          }`}
                        />
                      </Link>

                      {isDropdownOpen && (
                        <div className="absolute left-0 rtl:right-0 rtl:left-auto top-full pt-2 w-64 z-50">
                          <div className="bg-white rounded-2xl border border-[#DDE5E1] shadow-xl p-2 space-y-1">
                            {item.subItems.map((sub) => (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setOpenDropdown(null)}
                                className="block px-3 py-2 rounded-xl text-xs font-medium text-[#163447] hover:bg-[#EAF3FF] hover:text-[#176C5B] transition-colors"
                              >
                                {isAr ? sub.labelAr : sub.labelEn}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'text-white bg-[#176C5B] shadow-2xs'
                        : 'text-[#163447] hover:text-[#176C5B] hover:bg-[#EAF3FF]/60'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls & Prominent Book Action */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#DDE5E1] bg-white text-xs font-semibold text-[#163447] hover:border-[#176C5B] transition-all shadow-2xs"
                title="Toggle English / العربية"
              >
                <Languages className="w-3.5 h-3.5 text-[#176C5B]" />
                <span className="font-sans text-xs">{locale === 'en' ? 'العربية' : 'English'}</span>
              </button>

              {/* Visually Prominent Book an Appointment Action */}
              <Link
                href="/book"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#176C5B] text-white hover:bg-[#125648] transition-all duration-200 text-xs font-bold shadow-sm group whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5 text-[#EAF3FF] group-hover:scale-110 transition-transform" />
                <span>{localizedText(isAr ? 'ar' : 'en', 'text_7d4ef0aceb')}</span>
              </Link>

              {currentUser ? (
                <div className="flex items-center gap-2 pl-2 border-l border-[#DDE5E1]">
                  <Link
                    href={
                      primaryRole === 'PATIENT'
                        ? '/portal'
                        : primaryRole === 'RECEPTIONIST'
                        ? '/reception'
                        : primaryRole === 'DENTIST'
                        ? '/dentist'
                        : '/management'
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#EAF3FF] hover:bg-[#163447] text-[#163447] hover:text-white text-xs font-bold transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>{primaryRole === 'PATIENT' ? t.portal : localizedText(isAr ? 'ar' : 'en', 'text_8e36599bcc')}</span>
                  </Link>
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      aria-label="Logout"
                      className="p-2 text-slate-500 hover:text-[#B42318] hover:bg-rose-50 rounded-full transition-colors"
                      title={t.logout}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#DDE5E1] bg-white text-[#163447] text-xs font-bold hover:border-[#176C5B] hover:text-[#176C5B] transition-all shadow-2xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                  <span>{localizedText(isAr ? 'ar' : 'en', 'text_8e36599bcc')}</span>
                </Link>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="flex xl:hidden items-center gap-2">
              <button
                type="button"
                onClick={toggleLanguage}
                className="px-2.5 py-1 border border-[#DDE5E1] bg-white rounded-full text-xs font-semibold text-[#163447]"
              >
                {locale === 'en' ? 'عربي' : 'EN'}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#163447] hover:bg-[#EAF3FF] rounded-full transition-colors"
                aria-label={isAr?'فتح أو إغلاق القائمة':'Open or close menu'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-[#DDE5E1] bg-white px-6 py-6 space-y-3 shadow-xl max-h-[82vh] overflow-y-auto">
            {publicNavLinks.map((item) => (
              <div key={item.href} className="border-b border-slate-100 pb-2">
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-sm font-bold text-[#163447] hover:text-[#176C5B]"
                >
                  {item.label}
                </Link>
                {item.subItems && (
                  <div className="pl-3 rtl:pr-3 space-y-1 mt-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-1 text-xs text-slate-600 hover:text-[#176C5B]"
                      >
                        • {isAr ? sub.labelAr : sub.labelEn}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link
              href="/portal"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#176C5B] border-b border-slate-100"
            >
              {localizedText(isAr ? 'ar' : 'en', 'text_f48c645df8')}
            </Link>

            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-3 rounded-full bg-[#176C5B] text-white font-bold text-xs tracking-wider uppercase transition-colors shadow-sm"
            >
              {localizedText(isAr ? 'ar' : 'en', 'text_3486902a04')}
            </Link>

            {currentUser ? (
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="block text-sm font-bold text-[#163447]">{currentUser.fullName}</span>
                  <span className="text-xs text-slate-500 font-mono">{primaryRole}</span>
                </div>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="text-xs font-bold text-[#B42318] hover:underline">
                    {t.logout}
                  </button>
                </form>
              </div>
            ) : (
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 border border-[#DDE5E1] bg-white text-[#163447] rounded-full font-bold text-xs shadow-2xs"
                >
                  {localizedText(isAr ? 'ar' : 'en', 'text_128ec9d269')}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Bottom Quick Action Bar (Book, Call, Directions) */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#DDE5E1] px-3 py-2 flex items-center justify-around gap-2 shadow-lg"
        dir={localizedText(isAr ? 'ar' : 'en', 'text_52b133b060')}
      >
        <Link
          href="/book"
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#176C5B] text-white text-xs font-bold shadow-xs"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{localizedText(isAr ? 'ar' : 'en', 'text_f171838e14')}</span>
        </Link>
        <a
          href="tel:+20224150001"
          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#EAF3FF] text-[#163447] text-xs font-bold"
        >
          <Phone className="w-3.5 h-3.5 text-[#176C5B]" />
          <span>{localizedText(isAr ? 'ar' : 'en', 'text_f8106cefde')}</span>
        </a>
        <Link
          href="/branches"
          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#DDE5E1] bg-white text-[#163447] text-xs font-bold"
        >
          <MapPin className="w-3.5 h-3.5 text-[#176C5B]" />
          <span>{localizedText(isAr ? 'ar' : 'en', 'text_c1b7b21be3')}</span>
        </Link>
      </div>

      <AppointmentRequestModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </>
  );
}
