'use client';

import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function PageExperience({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const view = useSearchParams()?.get('view') || '';
  const workspace = pathname.split('/')[1] || 'public';
  const isClinicalDark =
    pathname === '/dentist' ||
    pathname.startsWith('/dentist/') ||
    pathname === '/doctor/exam-room' ||
    pathname === '/doctor/imaging';
  const themeMode = isClinicalDark ? 'clinical-dark' : 'hospitality';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    return () => {
      document.documentElement.setAttribute('data-theme', 'hospitality');
    };
  }, [themeMode]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const heading = document.querySelector('.page-experience h1');
    if (heading) {
      heading.animate(
        [
          { opacity: 0.25, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    }
  }, [pathname, view]);

  return (
    <div
      className={`page-experience relative z-10 min-h-screen w-full bg-transparent leading-relaxed ${
        isClinicalDark ? 'text-slate-100' : 'text-[#0B2528]'
      }`}
      data-workspace={workspace}
      data-theme={themeMode}
    >
      {children}
    </div>
  );
}
