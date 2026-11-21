'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Calendar,
  Phone,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { Button } from '../../../components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    primaryPhone: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push(data.redirectUrl || '/portal');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-[#D8E0DC] p-8 sm:p-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#D8E0DC] p-1.5 mx-auto shadow-2xs overflow-hidden">
            <img
              src="/images/ebtesamty_official_logo.jpg"
              alt="Ebtesamty Dental Clinics"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#123B67]">
              {isAr ? 'إنشاء حساب مريض جديد' : 'Create Patient Account'}
            </h1>
            <p className="text-xs text-[#526574] mt-1">
              {isAr
                ? 'سجل حسابك للوصول إلى خطط العلاج والمواعيد والفواتير في فروع القاهرة'
                : 'Access your dental appointments, treatment milestones, and digital receipts'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#123B67] mb-1.5">
              {isAr ? 'الاسم الكامل *' : 'Full Legal Name *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#526574] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder={isAr ? 'مثال: حسن أحمد السيد' : 'e.g., Hassan Ahmed'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] text-xs text-[#123B67] focus:border-[#1F6FB2] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                {isAr ? 'تاريخ الميلاد *' : 'Date of Birth *'}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#526574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] text-xs text-[#123B67] focus:border-[#1F6FB2] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                {isAr ? 'النوع *' : 'Gender *'}
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] text-xs text-[#123B67] focus:border-[#1F6FB2] focus:bg-white focus:outline-none transition-colors"
              >
                <option value="MALE">{isAr ? 'ذكر' : 'Male'}</option>
                <option value="FEMALE">{isAr ? 'أنثى' : 'Female'}</option>
                <option value="OTHER">{isAr ? 'آخر' : 'Other'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#123B67] mb-1.5">
              {isAr ? 'رقم الهاتف المحمول (مصر) *' : 'Mobile Phone Number (Egypt) *'}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#526574] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={formData.primaryPhone}
                onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                placeholder="+20 100 123 4567"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] text-xs text-[#123B67] focus:border-[#1F6FB2] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#123B67] mb-1.5">
              {isAr ? 'البريد الإلكتروني *' : 'Email Address *'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#526574] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="patient@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] text-xs text-[#123B67] focus:border-[#1F6FB2] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#123B67] mb-1.5">
              {isAr ? 'كلمة المرور (8 أحرف على الأقل) *' : 'Password (min. 8 characters) *'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#526574] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] text-xs text-[#123B67] focus:border-[#1F6FB2] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="p-3.5 bg-[#EAF3FF] border border-[#1F6FB2]/20 rounded-2xl text-[11px] text-[#1F6FB2] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {isAr
                ? 'حماية السجلات الطبية: إنشاء حساب عبر الإنترنت لا يربط سجلك الطبي الميداني تلقائياً دون مطابقة موثقة من موظف الاستقبال لضمان الخصوصية.'
                : 'Medical Privacy: Online profile creation requires verified matching by front desk reception before historic clinical records are exposed.'}
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full justify-center"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {isAr ? 'إتمام التسجيل' : 'Complete Registration'}
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-[#526574] space-y-2 border-t border-[#D8E0DC]">
          <div>
            {isAr ? 'لديك حساب بالفعل؟' : 'Already registered?'}{' '}
            <Link href="/auth/login" className="font-bold text-[#1F6FB2] hover:underline">
              {isAr ? 'تسجيل الدخول' : 'Sign In here'}
            </Link>
          </div>
          <div>
            <Link href="/demo" className="font-semibold text-xs text-[#123B67] hover:underline">
              {isAr ? 'أو تجربة الحسابات التجريبية (Demo Sandbox)' : 'Or explore with Demo Personas (/demo)'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
