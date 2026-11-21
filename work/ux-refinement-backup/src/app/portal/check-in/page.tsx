'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Building2, 
  User, 
  AlertCircle, 
  ArrowLeft,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';

export default function PatientCheckInPage() {
  const { locale, t } = useLanguage();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [arrivalEvent, setArrivalEvent] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('BR-A');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/patients/me');
      if (res.ok) {
        const data = await res.json();
        setPatient(data.patient);
        if (data.patient?.primaryBranchId) {
          setSelectedBranch(data.patient.primaryBranchId);
        }
      }

      // Check if arrival already reported today
      const arrRes = await fetch('/api/scheduling/arrivals');
      if (arrRes.ok) {
        const aData = await arrRes.json();
        if (aData.arrivals && aData.arrivals.length > 0) {
          setArrivalEvent(aData.arrivals[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportArrival = async () => {
    if (!patient) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/scheduling/arrivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          branchId: selectedBranch,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setArrivalEvent(data.arrival);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to report arrival');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/portal" className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 text-xs font-semibold mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'تسجيل الحضور في العيادة' : 'On-Site Clinic Arrival'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {locale === 'ar' ? 'أنا متواجد في العيادة الآن' : "I've Arrived at the Clinic"}
          </h1>
        </div>
      </div>

      <Alert variant="info" title={locale === 'ar' ? 'تنبيه سريري هام حول الانتظار:' : 'Clinical Arrival Protocol:'}>
        {locale === 'ar'
          ? 'الضغط على زر تسجيل الوصول يُبلغ موظف الاستقبال بتواجدك في مبنى العيادة. لن تدخل في قائمة الانتظار الفعلية إلا بعد التحقق من حضورك الفعلي وهويتك في مكتب الاستقبال.'
          : 'Tapping "I Have Arrived" notifies the front desk of your physical presence. In accordance with clinic safety policy, entry into the live consultation queue occurs once the receptionist verifies your presence at the desk.'}
      </Alert>

      {arrivalEvent ? (
        <Card className="border-teal-200 bg-teal-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant={arrivalEvent.isVerified ? 'success' : 'warning'}>
                {arrivalEvent.isVerified ? 'VERIFIED IN QUEUE' : 'ARRIVAL REPORTED (PENDING VERIFICATION)'}
              </Badge>
              <span className="text-xs text-slate-500">
                {new Date(arrivalEvent.reportedAt).toLocaleTimeString()}
              </span>
            </div>
            <CardTitle className="text-lg mt-2">
              {arrivalEvent.isVerified
                ? (locale === 'ar' ? 'تم التحقق من حضورك وإضافتك لقائمة الانتظار' : 'Your Presence is Verified — You Are in the Live Queue')
                : (locale === 'ar' ? 'تم استلام إشعار وصولك' : 'Arrival Self-Report Received')}
            </CardTitle>
            <CardDescription>
              {arrivalEvent.isVerified
                ? (locale === 'ar' ? 'يرجى التفضل بالاستراحة في ردهة الانتظار. سيقوم المساعد الطبي بمناداة اسمك قريباً.' : 'Please take a seat in the lounge. You will be called shortly by the dental assistant.')
                : (locale === 'ar' ? 'يرجى التوجه إلى مكتب الاستقبال لإبراز بطاقة الهوية وتأكيد دخولك في رول العيادة.' : 'Please present your ID to the receptionist at the front desk to confirm physical check-in and enter the active queue.')}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 border-t border-slate-200/60 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Branch: {arrivalEvent.branch?.name || selectedBranch}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Reported Timestamp: {new Date(arrivalEvent.reportedAt).toLocaleString()}</span>
            </div>
            {arrivalEvent.verifiedAt && (
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified by Reception at: {new Date(arrivalEvent.verifiedAt).toLocaleTimeString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {locale === 'ar' ? 'اختر الفرع المتواجد به حالياً' : 'Confirm Your Current Location'}
            </CardTitle>
            <CardDescription>
              {locale === 'ar' ? 'تأكد من اختيار الفرع الذي تزوره فعلياً لضمان توجيه ملفك لمكتب الاستقبال الصحيح.' : 'Select the physical branch where you are presently located.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {locale === 'ar' ? 'فرع العيادة' : 'Clinic Branch'}
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="BR-A">Branch A — Heliopolis (مصر الجديدة)</option>
                <option value="BR-B">Branch B — New Cairo (التجمع الخامس)</option>
                <option value="BR-C">Branch C — Maadi (المعادي)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {patient?.fullName} ({patient?.patientNumber})
              </span>
              <Button
                variant="primary"
                isLoading={submitting}
                onClick={handleReportArrival}
                leftIcon={<MapPin className="w-4 h-4" />}
              >
                {locale === 'ar' ? 'تأكيد: أنا متواجد بالعيادة الآن' : "Confirm: I'm Here on Site"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
