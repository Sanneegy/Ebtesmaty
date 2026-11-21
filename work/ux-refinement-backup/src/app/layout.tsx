import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';
import { Navbar } from '../components/Navbar';
import { AppShell } from '../components/AppShell';
import { getCurrentUser } from '../lib/auth';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Ebtesamty Dental Clinics (ابتسامتي) — Cairo Multi-Branch Dental Care',
  description:
    'Warm, trustworthy, evidence-based dental care across three Cairo branches (Heliopolis, New Cairo, Maadi). Online appointment booking, patient portal, and integrated clinical care.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen flex flex-col bg-[#F7F8F5] text-[#163447] antialiased selection:bg-[#176C5B] selection:text-white">
        <LanguageProvider>
          <Navbar currentUser={currentUser} />
          <React.Suspense fallback={<main className="flex-1">{children}</main>}>
            <AppShell currentUser={currentUser}>{children}</AppShell>
          </React.Suspense>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
