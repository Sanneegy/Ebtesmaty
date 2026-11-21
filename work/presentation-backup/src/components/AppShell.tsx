'use client';
import {localizedText} from '@/lib/interface-messages';


import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { BrandLogo } from './ui/BrandLogo';
import {
  WORKSPACE_CONFIGS,
  resolveActiveWorkspace,
  getAuthorizedWorkspacesForRole,
  NavItemConfig,
} from '../config/workspace-navigation';
import {
  Calendar,
  Users,
  CreditCard,
  Stethoscope,
  ClipboardCheck,
  LayoutDashboard,
  Building2,
  BarChart3,
  Boxes,
  ShoppingCart,
  Truck,
  Wrench,
  AlertTriangle,
  ShieldCheck,
  User,
  HeartPulse,
  Clock,
  FileText,
  Receipt,
  Settings,
  LogOut,
  Languages,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface AppShellProps {
  currentUser?: {
    id: string;
    fullName: string;
    email?: string | null;
    staffProfile?: { title: string } | null;
    roleGrants: { role: string; branch?: { code: string; name: string } | null }[];
  } | null;
  children: React.ReactNode;
}

const STAFF_PREFIXES = [
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

function renderNavIcon(iconName: string, className: string = 'w-4 h-4') {
  switch (iconName) {
    case 'Calendar':
      return <Calendar className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'Stethoscope':
      return <Stethoscope className={className} />;
    case 'ClipboardCheck':
      return <ClipboardCheck className={className} />;
    case 'LayoutDashboard':
      return <LayoutDashboard className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'BarChart3':
      return <BarChart3 className={className} />;
    case 'Boxes':
      return <Boxes className={className} />;
    case 'ShoppingCart':
      return <ShoppingCart className={className} />;
    case 'Truck':
      return <Truck className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    case 'AlertTriangle':
      return <AlertTriangle className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'User':
      return <User className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'Receipt':
      return <Receipt className={className} />;
    case 'Settings':
      return <Settings className={className} />;
    default:
      return <LayoutDashboard className={className} />;
  }
}

export function AppShell({ currentUser, children }: AppShellProps) {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const { locale, setLocale, t } = useLanguage();
  const isAr = locale === 'ar';

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);

  const primaryRole = currentUser?.roleGrants?.[0]?.role || null;
  const branchCode = currentUser?.roleGrants?.[0]?.branch?.code || null;
  const branchFull = currentUser?.roleGrants?.[0]?.branch?.name || null;

  const displayRoleLabel = (() => {
    const profileTitle = currentUser?.staffProfile?.title;
    if (
      profileTitle &&
      [
        'OWNER / EXECUTIVE',
        'FINANCE / ACCOUNTANT',
        'INVENTORY & PROCUREMENT',
        'MARKETING & CRM',
        'SUPER ADMIN',
        'OPERATIONS & FINANCE',
      ].includes(profileTitle)
    ) {
      return profileTitle;
    }
    if (primaryRole === 'BRANCH_MANAGER' || primaryRole === 'OWNER_ADMIN') {
      if (pathname.startsWith('/billing')) return 'FINANCE / ACCOUNTANT';
      if (pathname.startsWith('/inventory') || pathname.startsWith('/purchasing')) return 'INVENTORY & PROCUREMENT';
      if (pathname.startsWith('/crm')) return 'MARKETING & CRM';
      if (pathname.startsWith('/admin')) return 'SUPER ADMIN';
      return 'OWNER / EXECUTIVE';
    }
    return primaryRole || 'STAFF';
  })();

  const isPatientRoute = pathname === '/portal' || pathname.startsWith('/portal/');
  const isStaffRoute = STAFF_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

  const isNavItemActive = (item: NavItemConfig) => {
    const [targetPath, targetQuery] = item.href.split('?');
    if (targetQuery) {
      const params = new URLSearchParams(targetQuery);
      for (const [k, v] of params.entries()) {
        if (searchParams?.get(k) !== v) return false;
      }
      return pathname === targetPath;
    }
    if (item.exact) {
      const hasViewParam = searchParams?.get('view') || searchParams?.get('mode');
      return pathname === targetPath && !hasViewParam;
    }
    return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  };

  // ============================================================================
  // SHELL 1: PATIENT SHELL (Calm, Accessible, Mobile-First Portal)
  // ============================================================================
  if (isPatientRoute) {
    const patientConfig = WORKSPACE_CONFIGS.PATIENT;
    return (
      <div 
        className="eb-patient-shell min-h-screen flex flex-col text-[#15273D] font-['Plus_Jakarta_Sans',sans-serif] relative bg-cover bg-center bg-no-repeat bg-fixed" 
        style={{ backgroundColor: '#F7F8F5' }}
        dir={localizedText(isAr ? 'ar' : 'en', 'text_52b133b060')}
      >
        {/* Soft daylight ivory overlay ensuring maximum contrast and legibility */}
        <div className="absolute inset-0 bg-[#F8F9FA]/92 backdrop-blur-[2px] pointer-events-none" />
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 h-16 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/portal" className="flex items-center gap-2">
                <BrandLogo size="sm" variant="full" isArabic={isAr} />
              </Link>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-[#EBF9F1] text-[#0F827B] text-xs font-bold border border-[#D4F3E2]">
                {isAr ? patientConfig.titleAr : patientConfig.titleEn}
              </span>
            </div>

            <nav aria-label="Patient Portal Navigation" className="hidden md:flex items-center gap-1.5">
              {patientConfig.navItems.map((item) => {
                const active = isNavItemActive(item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      active
                        ? 'bg-[#0F827B] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#0F827B] hover:bg-slate-50'
                    }`}
                  >
                    {renderNavIcon(item.iconName, `w-3.5 h-3.5 ${active ? 'text-white' : 'text-[#0F827B]'}`)}
                    <span>{isAr ? item.labelAr : item.labelEn}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Languages className="w-3.5 h-3.5 text-[#0F827B]" />
                <span>{locale === 'en' ? 'عربي' : 'EN'}</span>
              </button>

              {currentUser && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#0F827B] text-white flex items-center justify-center text-xs font-bold">
                      {currentUser.fullName.charAt(0)}
                    </span>
                    <span className="hidden sm:inline max-w-[130px] truncate">{currentUser.fullName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-56 rounded-2xl bg-white border border-slate-100 shadow-xl py-2 z-50 text-xs font-['Plus_Jakarta_Sans',sans-serif]">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="font-bold text-slate-900">{currentUser.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                      </div>
                      <Link
                        href="/book"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-[#0F827B] font-semibold hover:bg-slate-50"
                      >
                        <span>{localizedText(isAr ? 'ar' : 'en', 'text_61e0635236')}</span>
                        <Calendar className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href="/"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <span>{localizedText(isAr ? 'ar' : 'en', 'text_92f408c003')}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                      <form action="/api/auth/logout" method="POST" className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          type="submit"
                          aria-label="Logout"
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t.logout}</span>
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                aria-label="Toggle menu"
                onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileDrawerOpen && (
            <div className="md:hidden bg-white border-b border-slate-100 px-4 py-3 space-y-1.5 shadow-lg">
              {patientConfig.navItems.map((item) => {
                const active = isNavItemActive(item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold ${
                      active ? 'bg-[#0F827B] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {renderNavIcon(item.iconName, 'w-4 h-4')}
                    <span>{isAr ? item.labelAr : item.labelEn}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </header>

        <main className="flex-1 relative">{children}</main>
      </div>
    );
  }

  // ============================================================================
  // SHELL 2: STAFF SHELL (Persistent 240px Role Sidebar + 64px Context Topbar)
  // ============================================================================
  if (isStaffRoute) {
    const activeWorkspace = resolveActiveWorkspace(pathname, primaryRole);
    const authorizedWorkspaces = getAuthorizedWorkspacesForRole(primaryRole);

    // Distinct photographic background for each role workspace
    let bgImageUrl = '/images/backgrounds/bg_manager.jpg';
    if (pathname.startsWith('/reception')) {
      bgImageUrl = '/images/backgrounds/bg_reception.jpg';
    } else if (pathname.startsWith('/dentist')) {
      bgImageUrl = '/images/backgrounds/bg_dentist.jpg';
    } else if (pathname.startsWith('/billing')) {
      bgImageUrl = '/images/backgrounds/bg_billing.jpg';
    } else if (pathname.startsWith('/crm')) {
      bgImageUrl = '/images/backgrounds/bg_crm.jpg';
    } else if (pathname.startsWith('/admin')) {
      bgImageUrl = '/images/backgrounds/bg_admin.jpg';
    } else if (pathname.startsWith('/inventory') || pathname.startsWith('/purchasing')) {
      bgImageUrl = '/images/backgrounds/bg_inventory.jpg';
    }

    return (
      <div 
        className="eb-staff-shell min-h-screen flex text-[#15273D] font-['Plus_Jakarta_Sans',sans-serif] relative bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundColor: '#F7F8F5' }}
        dir={localizedText(isAr ? 'ar' : 'en', 'text_52b133b060')}
      >
        {/* Soft daylight ivory overlay - photo twice as visible */}
        <div className="absolute inset-0 bg-[#F8F9FA]/78 backdrop-blur-[1px] pointer-events-none" />

        {/* Desktop Persistent Side Navigation (260px) */}
        <aside
          aria-label="Workspace Navigation"
          className="eb-staff-sidebar hidden lg:flex lg:flex-col lg:w-[260px] lg:shrink-0 bg-white/95 backdrop-blur-md border-r rtl:border-r-0 rtl:border-l border-slate-100 sticky top-0 h-screen z-30 justify-between shadow-[2px_0_15px_-3px_rgba(0,0,0,0.02)]"
        >
          <div className="p-4 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <Link href={activeWorkspace.defaultRoute} className="flex items-center gap-2">
                <BrandLogo size="sm" variant="full" isArabic={isAr} />
              </Link>
            </div>

            {/* Active Workspace Label / Switcher */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-2 mb-1.5">
                {localizedText(isAr ? 'ar' : 'en', 'text_eeb8d01387')}
              </span>
              {authorizedWorkspaces.length > 1 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setWorkspaceSwitcherOpen(!workspaceSwitcherOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#EBF9F1]/60 hover:bg-[#EBF9F1] text-xs font-bold text-[#0F827B] transition-colors border border-[#D4F3E2]"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Layers className="w-3.5 h-3.5 text-[#0F827B] shrink-0" />
                      <span className="truncate">{isAr ? activeWorkspace.titleAr : activeWorkspace.titleEn}</span>
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#0F827B] shrink-0" />
                  </button>

                  {workspaceSwitcherOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-100 shadow-xl py-1.5 z-50 space-y-0.5">
                      {authorizedWorkspaces.map((ws) => (
                        <Link
                          key={ws.id}
                          href={ws.defaultRoute}
                          onClick={() => setWorkspaceSwitcherOpen(false)}
                          className={`block px-3.5 py-2 text-xs font-semibold transition-colors ${
                            ws.id === activeWorkspace.id
                              ? 'bg-[#EBF9F1] text-[#0F827B] font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {isAr ? ws.titleAr : ws.titleEn}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3.5 py-2.5 rounded-2xl bg-[#EBF9F1] border border-[#D4F3E2] text-xs font-bold text-[#0F827B]">
                  {isAr ? activeWorkspace.titleAr : activeWorkspace.titleEn}
                </div>
              )}
            </div>

            {/* Role-Specific Primary Navigation Items */}
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-2 mb-1">
                {localizedText(isAr ? 'ar' : 'en', 'text_d02e5153ee')}
              </span>
              <nav className="space-y-1" aria-label="Primary Role Navigation">
                {activeWorkspace.navItems.map((item) => {
                  const active = isNavItemActive(item);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-150 ${
                        active
                          ? 'bg-[#0F827B] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {renderNavIcon(item.iconName, `w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#0F827B]'}`)}
                      <span>{isAr ? item.labelAr : item.labelEn}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Sidebar Bottom: Assigned Branch Scope + Public Website Link */}
          <div className="p-4 border-t border-slate-100 space-y-2.5 bg-slate-50/50">
            <div className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-100 text-xs shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                {localizedText(isAr ? 'ar' : 'en', 'text_daf6828a2c')}
              </span>
              <span className="font-bold text-slate-900 block truncate mt-0.5">
                {branchFull || (primaryRole === 'OWNER_ADMIN' ? 'All authorized branches' : 'Branch not assigned')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#0F827B] hover:bg-[#EBF9F1] transition-colors"
              >
                <span>{localizedText(isAr ? 'ar' : 'en', 'text_41607e621c')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Column: Top Context Bar (64px) + Page Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="eb-staff-topbar sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Toggle menu"
                onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                className="lg:hidden p-2 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2.5">
                <span className="text-sm font-extrabold text-slate-900">
                  {isAr ? activeWorkspace.titleAr : activeWorkspace.titleEn}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#0F827B] text-xs font-bold border border-[#D4F3E2]">
                  <Building2 className="w-3 h-3" />
                  <span>{branchCode || 'ALL-BR'}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                title="Toggle English / العربية"
              >
                <Languages className="w-3.5 h-3.5 text-[#0F827B]" />
                <span>{locale === 'en' ? 'عربي' : 'EN'}</span>
              </button>

              {currentUser && (
                <div className="relative flex items-center gap-2 pl-2 border-l border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors text-left rtl:text-right border border-slate-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0F827B] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {currentUser.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className="hidden sm:block">
                      <span className="block text-xs font-bold text-slate-900 leading-tight">
                        {currentUser.fullName}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {displayRoleLabel} {branchCode ? `(${branchCode})` : ''}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 rtl:left-0 rtl:right-auto top-full mt-2 w-60 rounded-2xl bg-white border border-slate-100 shadow-xl py-2 z-50 text-xs font-['Plus_Jakarta_Sans',sans-serif]">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="font-bold text-slate-900">{currentUser.fullName}</p>
                        <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                      </div>

                      {authorizedWorkspaces.length > 1 && (
                        <div className="py-1 border-b border-slate-100">
                          <span className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 block">
                            {localizedText(isAr ? 'ar' : 'en', 'text_448b0b8e39')}
                          </span>
                          {authorizedWorkspaces.map((ws) => (
                            <Link
                              key={ws.id}
                              href={ws.defaultRoute}
                              onClick={() => setProfileMenuOpen(false)}
                              className="block px-4 py-2 text-slate-700 hover:bg-[#EBF9F1] hover:text-[#0F827B] font-medium"
                            >
                              {isAr ? ws.titleAr : ws.titleEn}
                            </Link>
                          ))}
                        </div>
                      )}

                      <Link
                        href="/"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-slate-600 hover:bg-slate-50"
                      >
                        <span>{localizedText(isAr ? 'ar' : 'en', 'text_92f408c003')}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>

                      {process.env.NODE_ENV !== 'production' && (
                        <Link
                          href="/demo"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2.5 text-amber-800 bg-amber-50 hover:bg-amber-100 font-semibold"
                        >
                          <span>{localizedText(isAr ? 'ar' : 'en', 'text_8cce5c53a3')}</span>
                        </Link>
                      )}

                      <form action="/api/auth/logout" method="POST" className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          type="submit"
                          aria-label="Logout"
                          className="w-full flex items-center gap-2 px-4 py-2 text-[#B42318] hover:bg-rose-50 font-semibold"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t.logout}</span>
                        </button>
                      </form>
                    </div>
                  )}

                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      aria-label="Logout"
                      title={t.logout}
                      className="p-2 rounded-xl text-slate-500 hover:text-[#B42318] hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </header>

          {/* Mobile Responsive Staff Drawer */}
          {mobileDrawerOpen && (
            <div className="lg:hidden bg-white border-b border-[#DDE5E1] px-4 py-4 space-y-2 shadow-xl">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400">
                  {isAr ? activeWorkspace.titleAr : activeWorkspace.titleEn}
                </span>
                <Link
                  href="/"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-xs text-[#176C5B] font-semibold inline-flex items-center gap-1"
                >
                  <span>{localizedText(isAr ? 'ar' : 'en', 'text_54a2498927')}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              {activeWorkspace.navItems.map((item) => {
                const active = isNavItemActive(item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                      active ? 'bg-[#176C5B] text-white' : 'text-[#163447] hover:bg-[#EAF3FF]'
                    }`}
                  >
                    {renderNavIcon(item.iconName, 'w-4 h-4')}
                    <span>{isAr ? item.labelAr : item.labelEn}</span>
                  </Link>
                );
              })}
            </div>
          )}

          <main className="flex-1 relative">{children}</main>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
