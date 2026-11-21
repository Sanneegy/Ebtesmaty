'use client';
import {LocalizedInput,LocalizedTextarea} from '@/components/LocalizedControls';

import {TranslatedText} from '@/components/TranslatedText';


import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  Send,
  ThumbsUp,
  AlertCircle,
  HelpCircle,
  Building2,
  Star,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  currentUser: any;
  patientId: string | null;
  branches: Array<{ id: string; code: string; name: string }>;
  initialCases: any[];
}

export function PortalFeedbackClient({
  currentUser,
  patientId,
  branches,
  initialCases,
}: Props) {
  const [cases, setCases] = useState<any[]>(initialCases);
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [category, setCategory] = useState<'INQUIRY' | 'PRAISE' | 'COMPLAINT'>('INQUIRY');
  const [rating, setRating] = useState<number>(5);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          branchId,
          category,
          subject: subject || (category === 'PRAISE' ? `Verified Visit Review (${rating}/5 Stars)` : 'Patient Feedback'),
          description: category === 'PRAISE' ? `[Rating: ${rating}/5 Stars] ${description}` : description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit feedback');

      setNotification({
        message: 'Your message has been received by our clinic management team.',
        type: 'success',
      });
      setCases([data.feedback, ...cases]);
      setSubject('');
      setDescription('');
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-[#0B2528] pb-16 font-sans">
      <header className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bento-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="p-2.5 rounded-full text-slate-500 hover:text-[#0B2528] hover:bg-[#F7F6F2] border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-2xl bg-[#0B2528] text-[#C8A96E] flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0B2528] tracking-tight"><TranslatedText text="Patient Feedback &amp; Support" /></h1>
              <p className="text-xs text-slate-500"><TranslatedText text="Inquiries, Verified Visit Reviews, and Quality Concerns" /></p>
            </div>
          </div>
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#F9F5EB] text-[#0B2528] border border-[#C8A96E]/40"> <TranslatedText text="Direct to Clinic Executive" /> </span>
        </div>
      </header>

      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-xs shadow-xs ${
              notification.type === 'success'
                ? 'bg-[#EBF9F1] text-[#2446A6] border border-[#D4F3E2]'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2446A6]" />
              <span className="font-semibold">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-bold hover:underline"
            > <TranslatedText text="Dismiss" /> </button>
          </div>
        )}

        {/* Submission Form Card */}
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900"><TranslatedText text="Send Message or Review to Clinic Management" /></h2>
              <p className="text-xs text-slate-500"> <TranslatedText text="Your feedback is reviewed directly by our clinic directors to ensure clinical excellence and continuous improvement." /> </p>
            </div>
            <span className="text-xs font-bold text-[#2446A6] px-3 py-1 rounded-full bg-[#EBF9F1] border border-[#D4F3E2] self-start sm:self-auto"> <TranslatedText text="Zero-Fabrication Policy" /> </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#102A5E] mb-1.5"><TranslatedText text="Clinic Branch *" /></label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full bg-[#F7FAFF] border border-[#D8E0DC] rounded-xl px-3.5 py-2.5 text-xs text-[#102A5E] focus:border-[#4169E1] focus:outline-none font-semibold"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      <TranslatedText text={String(b.name)}/> ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A5E] mb-1.5"><TranslatedText text="Feedback Nature" /></label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('INQUIRY')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      category === 'INQUIRY'
                        ? 'bg-[#EAF3FF] border-[#4169E1] text-[#4169E1]'
                        : 'bg-[#F7FAFF] border-[#D8E0DC] text-[#526574] hover:bg-white'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> <TranslatedText text="Inquiry" /> </button>
                  <button
                    type="button"
                    onClick={() => setCategory('PRAISE')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      category === 'PRAISE'
                        ? 'bg-[#EAF3FF] border-[#4169E1] text-[#4169E1]'
                        : 'bg-[#F7FAFF] border-[#D8E0DC] text-[#526574] hover:bg-white'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> <TranslatedText text="Review" /> </button>
                  <button
                    type="button"
                    onClick={() => setCategory('COMPLAINT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      category === 'COMPLAINT'
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : 'bg-[#F7FAFF] border-[#D8E0DC] text-[#526574] hover:bg-white'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> <TranslatedText text="Complaint" /> </button>
                </div>
              </div>
            </div>

            {category === 'PRAISE' && (
              <div className="p-4 rounded-2xl bg-[#F7FAFF] border border-[#D8E0DC] space-y-2">
                <label className="block text-xs font-bold text-[#102A5E]"><TranslatedText text="Overall Visit Satisfaction" /></label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`p-1.5 rounded-lg transition-transform hover:scale-110 ${
                        s <= rating ? 'text-amber-500' : 'text-[#D8E0DC]'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#102A5E] ml-2">
                    {rating} <TranslatedText text="out of 5 Stars" /> </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#102A5E] mb-1.5"><TranslatedText text="Subject *" /></label>
              <LocalizedInput
                type="text"
                required
                placeholder="e.g. Follow-up consultation question or feedback regarding today's visit"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#F7FAFF] border border-[#D8E0DC] rounded-xl px-3.5 py-2.5 text-xs text-[#102A5E] focus:border-[#4169E1] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102A5E] mb-1.5"><TranslatedText text="Message Details *" /></label>
              <LocalizedTextarea
                rows={4}
                required
                placeholder="Please describe your experience or question in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#F7FAFF] border border-[#D8E0DC] rounded-xl p-3.5 text-xs text-[#102A5E] focus:border-[#4169E1] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#526574] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4169E1]" /> <TranslatedText text="All complaints receive management escalation within 24 hours." /> </span>
              <Button type="submit" variant="primary" size="md" isLoading={loading} icon={<Send className="w-3.5 h-3.5" />}> <TranslatedText text="Submit Message" /> </Button>
            </div>
          </form>
        </div>

        {/* Previous Cases */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#102A5E]"><TranslatedText text="Your Past Submissions & Management Responses" /></h3>
          {cases.map((c) => (
            <div key={c.id} className="bg-white p-5 sm:p-6 rounded-3xl border border-[#D8E0DC] shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      c.category === 'COMPLAINT'
                        ? 'bg-red-50 text-red-700'
                        : c.category === 'PRAISE'
                        ? 'bg-[#EAF3FF] text-[#4169E1]'
                        : 'bg-[#F7FAFF] text-[#102A5E] border border-[#D8E0DC]'
                    }`}
                  >
                    {c.category}
                  </span>
                  <span className="font-bold text-[#102A5E] text-sm">{c.subject}</span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    c.status === 'RESOLVED'
                      ? 'bg-[#EAF3FF] text-[#4169E1]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <TranslatedText text={String(c.status)}/>
                </span>
              </div>

              <p className="text-[#526574] leading-relaxed"><TranslatedText text={String(c.description)}/></p>

              {c.patientVisibleResponse && (
                <div className="mt-3 p-3.5 bg-[#EAF3FF] border border-[#4169E1]/30 rounded-2xl text-[#102A5E] space-y-1">
                  <strong className="block text-xs text-[#4169E1] font-extrabold"> <TranslatedText text="Response from Clinic Executive:" /> </strong>
                  <p className="text-xs text-[#102A5E]">{c.patientVisibleResponse}</p>
                </div>
              )}
            </div>
          ))}
          {cases.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-[#D8E0DC] text-[#526574] text-xs"> <TranslatedText text="You haven&apos;t submitted any inquiries or reviews yet." /> </div>
          )}
        </div>
      </main>
    </div>
  );
}
