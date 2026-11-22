'use client';

import { TranslatedText } from '@/components/TranslatedText';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { presentationAccounts } from '@/lib/presentation';
import { ArrowUpRight, Sparkles, X } from 'lucide-react';

const WORKSPACE_PREFIXES = [
  '/owner',
  '/doctor',
  '/reception',
  '/patient',
  '/portal',
  '/management',
  '/dentist',
  '/billing',
  '/inventory',
  '/crm',
  '/admin',
];

export function PresentationAccess({
  inline = false,
  compactHeader = false,
}: {
  inline?: boolean;
  compactHeader?: boolean;
}) {
  const { locale } = useLanguage();
  const ar = locale === 'ar';
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || '/';

  if (!inline && !compactHeader && pathname === '/auth/login') return null;

  // On workspace routes, PresentationAccess is docked inside the top header utility bar (compactHeader=true)
  // so we never render the overlapping bottom floating pill there.
  if (
    !inline &&
    !compactHeader &&
    WORKSPACE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return null;
  }

  if (compactHeader) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#0F2926] hover:bg-[#163D38] px-3 py-1.5 text-xs font-extrabold text-white shadow-xs transition active:scale-95 whitespace-nowrap"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#C8A96E] shrink-0" />
          <span>{ar ? 'دخول العرض التقديمي' : 'Presentation access'}</span>
        </button>

        {open && (
          <div className="absolute end-0 top-full mt-2 w-80 sm:w-96 rounded-3xl border border-slate-200/90 bg-white p-4 text-[#0B2528] shadow-2xl z-50 space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <h2 className="text-sm font-black">
                {ar ? 'اختر مساحة العمل' : 'Choose your workspace'}
              </h2>
              <button
                type="button"
                aria-label={ar ? 'إغلاق' : 'Close'}
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              {ar
                ? 'دخول مباشر بحسابات العرض المحفوظة لكل دور وظيفي'
                : 'One click opens your saved presentation account.'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {presentationAccounts.map((a) => (
                <form key={a.email} action="/api/auth/demo-switch" method="POST">
                  <input type="hidden" name="email" value={a.email} />
                  <button
                    className="presentation-account w-full text-start"
                    type="submit"
                  >
                    <span className="text-[11px] font-bold text-teal-800 block">
                      {ar ? a.roleAr : a.role}
                    </span>
                    <span className="text-xs font-semibold flex items-center justify-between gap-1.5">
                      <TranslatedText text={String(a.name)} />
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                    </span>
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className={inline ? 'mt-7 border-t pt-6' : 'presentation-access'}>
      {!inline && (
        <button
          className="primary-button shadow-lg"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <Sparkles size={18} />
          {ar ? 'دخول العرض التقديمي' : 'Presentation access'}
        </button>
      )}
      {(inline || open) && (
        <div className={inline ? 'space-y-3' : 'presentation-panel space-y-3'}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">{ar ? 'اختر مساحة العمل' : 'Choose your workspace'}</h2>
            {!inline && (
              <button aria-label={ar ? 'إغلاق' : 'Close'} onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            )}
          </div>
          <p className="text-sm text-slate-600">
            {ar ? 'دخول مباشر بحسابات العرض المحفوظة' : 'One click opens your saved presentation account.'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {presentationAccounts.map((a) => (
              <form key={a.email} action="/api/auth/demo-switch" method="POST">
                <input type="hidden" name="email" value={a.email} />
                <button className="presentation-account" type="submit">
                  <span className="text-xs font-bold text-teal-800">{ar ? a.roleAr : a.role}</span>
                  <span className="font-semibold flex items-center justify-between gap-2">
                    <TranslatedText text={String(a.name)} />
                    <ArrowUpRight size={15} />
                  </span>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
