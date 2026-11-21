'use client';

import {authMessages} from '@/lib/auth-messages';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Stethoscope, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy=authMessages[locale];
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        router.push('/portal');
      }
    } catch (err: any) {
      setError(copy.error);
    } finally {
      setLoading(false);
    }
  };

  const fillQuick = (email: string) => {
    setEmailOrPhone(email);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{copy.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {copy.intro}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-identity" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {copy.identity}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-identity" autoComplete="username" dir="ltr" type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="name@example.com or +2010..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {copy.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password" autoComplete="current-password" type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? copy.loading : copy.submit}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {process.env.NODE_ENV==='development' && process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN==='true' && <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="text-center mb-3">
            <span className="text-xs text-slate-400 font-medium">{copy.demo}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillQuick('hassan.patient@ebtesamty.dev')}
              className="p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-left font-medium transition-colors"
            >
              👤 Patient (Hassan)
            </button>
            <button
              type="button"
              onClick={() => fillQuick('mariam.reception@ebtesamty.dev')}
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-left font-medium transition-colors"
            >
              📋 Reception (Mariam)
            </button>
            <button
              type="button"
              onClick={() => fillQuick('dr.sandy@ebtesamty.dev')}
              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-left font-medium transition-colors"
            >
              🩺 Dentist (Dr. Sandy)
            </button>
            <button
              type="button"
              onClick={() => fillQuick('manager.b1@ebtesamty.dev')}
              className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-left font-medium transition-colors"
            >
              📊 Manager (Amr)
            </button>
          </div>
        </div>

        }
        <div className="mt-6 text-center text-xs text-slate-500">
          {copy.newPatient}{' '}
          <Link href="/auth/register" className="font-bold text-teal-700 hover:underline">
            {copy.register}
          </Link>
        </div>
      </div>
    </div>
  );
}
