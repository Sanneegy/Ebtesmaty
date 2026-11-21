import { DemoDataBanner } from '@/components/DemoDataBanner';
import db from '@/lib/db';
import { PageExperience } from '@/components/PageExperience';
import { PresentationAccess } from '@/components/PresentationAccess';
import { presentationEnabled } from '@/lib/presentation';
import { localizedText } from '@/lib/interface-messages';
import { cookies } from 'next/headers';
import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';
import { Navbar } from '../components/Navbar';
import { AppShell } from '../components/AppShell';
import { getCurrentUser } from '../lib/auth';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Ebtesamty Dental Clinics (ابتسامتي) — Minya Multi-Branch Dental Care',
  description:
    'Warm, trustworthy, evidence-based dental care across three Minya branches (Branch A, Branch B, Branch C). Online appointment booking, patient portal, and integrated clinical care.',
  manifest: '/manifest.json',
  icons: {
    icon: '/images/ebtesamty-logo.png',
    shortcut: '/images/ebtesamty-logo.png',
    apple: '/images/ebtesamty-logo.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const locale = cookies().get('ebtesamty_locale')?.value === 'ar' ? 'ar' : 'en';

  const demo = process.env.DATA_MODE === 'fictional-demo';
  const dataset = demo
    ? await db.auditEvent
        .findFirst({
          where: { action: 'FICTIONAL_DEMO_INITIALIZED' },
          orderBy: { createdAt: 'asc' },
        })
        .catch(() => null)
    : null;
  const period = dataset?.metadataJson as { reportingStart?: string; reportingEnd?: string } | null;

  return (
    <html lang={locale} dir={localizedText(locale === 'ar' ? 'ar' : 'en', 'text_52b133b060')}>
      <body className="min-h-screen flex flex-col bg-transparent text-[#0B2528] antialiased selection:bg-[#0B2528] selection:text-[#C8A96E]">
        <LanguageProvider initialLocale={locale}>
          {demo && <DemoDataBanner start={period?.reportingStart} end={period?.reportingEnd} />}
          <Navbar currentUser={currentUser} />
          <React.Suspense fallback={<main className="flex-1">{children}</main>}>
            <AppShell currentUser={currentUser}>
              <PageExperience>{children}</PageExperience>
            </AppShell>
          </React.Suspense>
          <Footer />
          {presentationEnabled() && <PresentationAccess />}
        </LanguageProvider>
      </body>
    </html>
  );
}
