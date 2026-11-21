"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mic,
  Send,
  Lock,
  Check,
  X,
  PhoneOff,
  ShieldAlert,
  Sparkles,
  Volume2,
  Minus,
} from "lucide-react";
import type { AssistantRole, AiSecurityAuditLogEntry } from "@/app/api/ai/assistant/route";

interface ChatEntry {
  id: string;
  sender: "user" | "ai";
  text: string;
  byVoice?: boolean;
  msgType?: "standard_answer" | "permission_boundary" | "action_confirmation" | "executed_action";
  source?: { label: string; href: string };
  actionPillLabel?: string;
  pendingConfirmation?: {
    tool: string;
    title: string;
    recipient: string;
    previewText: string;
  };
  safePivots?: { label: string; prompt: string }[];
}

const ROLE_CONFIG: Record<
  AssistantRole,
  {
    headerTitle: string;
    scopeBadge: string;
    tooltip: string;
    voiceAllowed: boolean;
    starterChips: string[];
    outOfScopeTestChip: string;
  }
> = {
  clinic_owner: {
    headerTitle: "Ebtesamty AI",
    scopeBadge: "Full Clinic & Financial Access",
    tooltip: "Ask Ebtesamty AI • Full Clinic & Finance",
    voiceAllowed: true,
    starterChips: [
      "How much did we collect today?",
      "Who didn't show up today?",
      "What was the most requested service this month?",
      "Compare revenue by doctor this week",
    ],
    outOfScopeTestChip: "طب أرباح آخر ثلاث شهور أخبارها إيه؟ وعملنا بريك إيفين عند إيه؟",
  },
  doctor: {
    headerTitle: "Clinical AI Assistant",
    scopeBadge: "My Schedule & Clinical Records",
    tooltip: "Clinical AI • Voice & Records",
    voiceAllowed: true,
    starterChips: [
      "Who is my next patient and what are their allergies?",
      "Summarize today's first patient's clinical history",
      "Are any of my lab cases ready?",
      "Draft a clinical note from my voice summary",
    ],
    outOfScopeTestChip: "How much did the clinic collect today?",
  },
  receptionist: {
    headerTitle: "Front-Desk AI",
    scopeBadge: "Appointments, Billing & CRM",
    tooltip: "Front-Desk AI • Schedule & Billing",
    voiceAllowed: false,
    starterChips: [
      "Who didn't show up today?",
      "Draft WhatsApp reminders for tomorrow's appointments",
      "Which patients have unpaid balances today?",
      "Show uncontacted CRM leads from this week",
    ],
    outOfScopeTestChip: "What is our profit margin and what did Ahmed's X-ray show?",
  },
  patient: {
    headerTitle: "Ebtesamty Care Assistant",
    scopeBadge: "Personal Visits & Billing",
    tooltip: "Need help? Ask Ebtesamty",
    voiceAllowed: false,
    starterChips: [
      "When is my next appointment?",
      "How much is remaining on my treatment plan?",
      "Is my dental crown ready yet?",
      "What are the clinic's working hours?",
    ],
    outOfScopeTestChip: "How much money did the clinic make today?",
  },
};

function getInitialMessagesForRole(role: AssistantRole): ChatEntry[] {
  if (role === "clinic_owner") {
    return [
      {
        id: "INIT-1",
        sender: "user",
        text: "How much did we collect today?",
        byVoice: true,
      },
      {
        id: "INIT-2",
        sender: "ai",
        msgType: "standard_answer",
        text: "EGP 12,450 from 9 payments — 18% higher than yesterday. Want a breakdown by dentist?",
        source: {
          label: "Source: today’s payments ↗",
          href: "/billing",
        },
      },
      {
        id: "INIT-3",
        sender: "user",
        text: "And who didn’t show up?",
      },
      {
        id: "INIT-4",
        sender: "ai",
        msgType: "action_confirmation",
        text: "3 patients: Youssef Hassan 11:30 · Heba Mostafa 11:00 · Khaled Omar 12:00. Shall I send them a reminder?",
        actionPillLabel: "Needs a tap from you",
        pendingConfirmation: {
          tool: "draft_whatsapp_message",
          title: "WhatsApp Reminder (+201200054405)",
          recipient: "Youssef Hassan, Heba Mostafa, Khaled Omar",
          previewText:
            "Hello from Ebtesamty Clinic (+201200054405): We missed you today. Reply 1 to reschedule your visit.",
        },
        source: {
          label: "Source: Appointments → Today's Schedule ↗",
          href: "/reception/agenda",
        },
      },
    ];
  }

  if (role === "doctor") {
    return [
      {
        id: "DOC-INIT-1",
        sender: "user",
        text: "Who is my next patient and what are their allergies?",
        byVoice: true,
      },
      {
        id: "DOC-INIT-2",
        sender: "ai",
        msgType: "standard_answer",
        text: "Next patient: Ibrahim Yassin Shaheen (23 yrs · Code #57). Medical Alert: Penicillin Allergy & Mild Hypertension. Scheduled for Tooth #36 Post & Core.",
        source: {
          label: "Source: Patient Records → Clinical Summary ↗",
          href: "/dentist",
        },
      },
    ];
  }

  if (role === "receptionist") {
    return [
      {
        id: "REC-INIT-1",
        sender: "user",
        text: "Who didn't show up today?",
      },
      {
        id: "REC-INIT-2",
        sender: "ai",
        msgType: "action_confirmation",
        text: "3 patients: Youssef Hassan 11:30 · Heba Mostafa 11:00 · Khaled Omar 12:00. Shall I send them a reminder?",
        actionPillLabel: "Needs a tap from you",
        pendingConfirmation: {
          tool: "draft_appointment_reminder",
          title: "Send WhatsApp Reminder (+201200054405)",
          recipient: "Youssef Hassan, Heba Mostafa, Khaled Omar",
          previewText:
            "Hello from Ebtesamty Clinic (+201200054405): We missed you today. Reply 1 to reschedule.",
        },
        source: {
          label: "Source: Appointments → Today's Schedule ↗",
          href: "/reception/agenda",
        },
      },
    ];
  }

  return [
    {
      id: "PAT-INIT-1",
      sender: "user",
      text: "When is my next appointment?",
    },
    {
      id: "PAT-INIT-2",
      sender: "ai",
      msgType: "standard_answer",
      text: "Your next appointment is Sunday at 5:30 PM with Dr. Ahmed El-Sherif (Step 2: Post & Core on Tooth #36).",
      source: {
        label: "Source: Patient Portal → My Appointments ↗",
        href: "/portal/appointments",
      },
    },
  ];
}

export default function EbtesamtyFloatingAiAssistant() {
  const pathname = usePathname() || "/";

  const inferredPathRole: AssistantRole = useMemo(() => {
    if (pathname.startsWith("/dentist") || pathname.startsWith("/doctor")) return "doctor";
    if (pathname.startsWith("/reception")) return "receptionist";
    if (
      pathname.startsWith("/portal") ||
      pathname.startsWith("/patient") ||
      pathname.startsWith("/book")
    )
      return "patient";
    return "clinic_owner";
  }, [pathname]);

  const [isOpen, setIsOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<AssistantRole>(inferredPathRole);
  const [messages, setMessages] = useState<ChatEntry[]>(() =>
    getInitialMessagesForRole(inferredPathRole)
  );
  const [inputText, setInputText] = useState("");
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [liveVoiceCallMode, setLiveVoiceCallMode] = useState(false);
  const [showSecurityLogs, setShowSecurityLogs] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<AiSecurityAuditLogEntry[]>([]);
  const [expandedConfirmationId, setExpandedConfirmationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveRole(inferredPathRole);
    setMessages(getInitialMessagesForRole(inferredPathRole));
  }, [inferredPathRole]);

  const config = ROLE_CONFIG[activeRole];

  const handleSendQuery = async (customPrompt?: string, byVoiceFlag?: boolean) => {
    const q = (customPrompt ?? inputText).trim();
    if (!q || loading) return;

    const userMsg: ChatEntry = {
      id: `USR-${Date.now()}`,
      sender: "user",
      text: q,
      byVoice: byVoiceFlag ?? isVoiceListening,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          pathContextRole: activeRole,
          isVoice: byVoiceFlag ?? isVoiceListening,
        }),
      });
      const data = await res.json();

      if (data.type === "permission_boundary") {
        setMessages((prev) => [
          ...prev,
          {
            id: `AI-${Date.now()}`,
            sender: "ai",
            msgType: "permission_boundary",
            text: data.message,
            safePivots: data.safePivots || [],
          },
        ]);
      } else if (data.type === "action_confirmation") {
        const msgId = `AI-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: msgId,
            sender: "ai",
            msgType: "action_confirmation",
            text: data.answer,
            actionPillLabel: data.actionPillLabel || "Needs a tap from you",
            pendingConfirmation: data.pendingConfirmation,
            source: data.source,
          },
        ]);
        setExpandedConfirmationId(msgId);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `AI-${Date.now()}`,
            sender: "ai",
            msgType: "standard_answer",
            text: data.answer,
            source: data.source,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `AI-${Date.now()}`,
          sender: "ai",
          msgType: "standard_answer",
          text: "Unable to reach Ebtesamty AI server right now.",
        },
      ]);
    } finally {
      setLoading(false);
      setIsVoiceListening(false);
    }
  };

  const handleConfirmAction = async (entry: ChatEntry) => {
    if (!entry.pendingConfirmation) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathContextRole: activeRole,
          executeConfirmation: {
            tool: entry.pendingConfirmation.tool,
            summary: `${entry.pendingConfirmation.title} → ${entry.pendingConfirmation.recipient}`,
          },
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `AI-EXEC-${Date.now()}`,
          sender: "ai",
          msgType: "executed_action",
          text: data.answer,
          source: data.source,
        },
      ]);
      setExpandedConfirmationId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSecurityLogs = async () => {
    setShowSecurityLogs((v) => !v);
    try {
      const res = await fetch("/api/ai/assistant");
      const data = await res.json();
      setSecurityLogs(data.logs || []);
    } catch {}
  };

  return (
    <>
      {/* ====================================================================
          OPEN STATE: EXPANDED POPOVER CHAT WINDOW (380px × 540px, bottom: 96px, right: 24px)
          Matching Reference Image 14 & Image 15
         ==================================================================== */}
      {isOpen && (
        <aside
          dir="ltr"
          aria-label={config.headerTitle}
          style={{
            width: "380px",
            height: "540px",
            bottom: "96px",
            right: "24px",
            borderRadius: "16px",
            zIndex: 9999,
          }}
          className="fixed flex flex-col justify-between overflow-hidden border border-slate-200/90 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] max-w-[calc(100vw-32px)]"
        >
          {/* Header Bar */}
          <div className="border-b border-slate-100 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">
                    {config.headerTitle}
                  </h3>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
                    It answers from your own data
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                    ● {config.scopeBadge}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {config.voiceAllowed && (
                  <button
                    type="button"
                    onClick={() => setLiveVoiceCallMode((v) => !v)}
                    title="Toggle Live Voice Assistant Mode (Image 15)"
                    className={`rounded-full p-1.5 text-xs font-bold transition ${
                      liveVoiceCallMode
                        ? "bg-rose-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {activeRole === "clinic_owner" && (
                  <button
                    type="button"
                    onClick={handleFetchSecurityLogs}
                    title="AI Security Audit Logs (Owner Only)"
                    className={`rounded-full p-1.5 text-xs transition ${
                      showSecurityLogs
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Minimize AI Assistant"
                  className="rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Body: Either Security Audit Logs (Owner), Live Voice Mode (Image 15), or Standard Chat (Image 14) */}
          {showSecurityLogs && activeRole === "clinic_owner" ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900">
                  ai_security_audit_logs (Owner Only)
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecurityLogs(false)}
                  className="text-blue-600 font-bold"
                >
                  Back to chat
                </button>
              </div>
              {securityLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-amber-200 bg-white p-3 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-700">
                    <span>
                      Role: {log.role} ({log.user_id})
                    </span>
                    <span>{log.timestamp.slice(11, 19)}</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    Blocked: {log.blocked_intent}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Query: &ldquo;{log.query_preview}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          ) : liveVoiceCallMode ? (
            /* IMAGE 15 EXACT VIEW: Live Voice / Video Assistant Mode ("محادثة مباشرة · مساعدك الذكي") */
            <div
              dir="rtl"
              className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-blue-50/40 p-4 flex flex-col justify-between"
            >
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg ring-4 ring-pink-100 animate-pulse">
                  <span className="text-xl font-black">◕‿◕</span>
                </div>
                <div className="mt-1.5 text-[11px] font-bold text-slate-400">
                  مساعدك الذكي...
                </div>
                <div className="text-sm font-black text-slate-800">محادثة مباشرة</div>
              </div>

              <div className="my-3 space-y-2.5 text-xs overflow-y-auto max-h-60">
                <div className="ms-auto max-w-[85%] rounded-2xl bg-blue-100/80 px-3.5 py-2 text-slate-900 font-bold">
                  افتحي ملف المريض إبراهيم
                  <div className="text-[10px] text-slate-400 mt-0.5">10:31 AM ✓✓</div>
                </div>
                <div className="me-auto max-w-[85%] rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-slate-800 font-semibold shadow-2xs">
                  حاضر، بفتح ملف المريض إبراهيم الآن.
                </div>
                <div className="ms-auto max-w-[85%] rounded-2xl bg-blue-100/80 px-3.5 py-2 text-slate-900 font-bold">
                  طب أرباح آخر ثلاث شهور أخبارها إيه؟ وعملنا بريك إيفين عند إيه؟
                  <div className="text-[10px] text-slate-400 mt-0.5">10:33 AM ✓✓</div>
                </div>
                <div className="me-auto max-w-[92%] rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-2xs space-y-1">
                  <div className="font-bold">تمام. آخر 3 شهور:</div>
                  <div className="font-black text-blue-700">
                    📊 إجمالي الإيرادات: 486,000 جنيه
                  </div>
                  <div className="font-black text-emerald-700">
                    🪙 صافي الربح: 174,000 جنيه
                  </div>
                  <ul className="list-disc ps-4 text-[11px] text-slate-600 space-y-0.5">
                    <li>الشهر الأول: إيرادات 142,000 وصافي 47,000.</li>
                    <li>الشهر الثاني: إيرادات 158,000 وصافي 58,000.</li>
                    <li>الشهر الثالث: إيرادات 186,000 وصافي 69,000.</li>
                  </ul>
                  <div className="pt-1 text-[11px] font-bold text-slate-800">
                    🎯 نقطة التعادل (Break-even) عند 112,000 جنيه شهريًا، وحققناها خلال الشهر الثالث يوم 18.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setLiveVoiceCallMode(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600"
                  title="إنهاء المكالمة"
                >
                  <PhoneOff className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendQuery(
                      "طب أرباح آخر ثلاث شهور أخبارها إيه؟ وعملنا بريك إيفين عند إيه؟",
                      true
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300"
                  title="تحدث بالصوت"
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            /* IMAGE 14 EXACT CHAT VIEW */
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              {messages.map((m) =>
                m.sender === "user" ? (
                  <div
                    key={m.id}
                    className="max-w-[78%] rounded-2xl border border-slate-200/90 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900"
                  >
                    <div className="font-semibold">{m.text}</div>
                    {m.byVoice && (
                      <div className="mt-1 text-right text-[10px] font-medium text-slate-400">
                        By voice
                      </div>
                    )}
                  </div>
                ) : m.msgType === "permission_boundary" ? (
                  /* 2. PERMISSION BOUNDARY CARD (Out-of-Scope Query) */
                  <div
                    key={m.id}
                    className="ms-auto max-w-[92%] rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-slate-900 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                          Permission Boundary
                        </div>
                        <p className="mt-0.5 font-semibold text-slate-800 leading-relaxed">
                          {m.text}
                        </p>
                      </div>
                    </div>

                    {m.safePivots && m.safePivots.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.safePivots.map((piv, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendQuery(piv.prompt)}
                            className="rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-black text-amber-900 shadow-2xs hover:bg-amber-100"
                          >
                            {piv.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* 1. STANDARD ANSWER BUBBLE & 3. ACTION CONFIRMATION CARD — Exact match to Image 14 */
                  <div key={m.id} className="space-y-2">
                    <div className="ms-auto max-w-[92%] rounded-2xl bg-blue-600 px-4 py-3 text-xs text-white shadow-xs">
                      <div className="font-semibold leading-relaxed">
                        {m.text}{" "}
                        {m.source && m.msgType !== "action_confirmation" && (
                          <Link
                            href={m.source.href}
                            className="ms-1 inline-flex items-center rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[11px] font-black text-white hover:bg-white/25"
                          >
                            {m.source.label}
                          </Link>
                        )}
                        {m.actionPillLabel && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedConfirmationId((prev) =>
                                prev === m.id ? null : m.id
                              )
                            }
                            className="ms-1 inline-flex items-center rounded-full border border-white/30 bg-white/20 px-2.5 py-0.5 text-[11px] font-black text-white hover:bg-white/30"
                          >
                            {m.actionPillLabel}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Interactive Human-in-the-Loop Action Preview Card */}
                    {m.pendingConfirmation && expandedConfirmationId === m.id && (
                      <div className="ms-auto max-w-[92%] rounded-2xl border border-blue-200 bg-blue-50/90 p-3.5 text-xs text-slate-900 shadow-xs space-y-2">
                        <div className="font-black text-blue-950">
                          {m.pendingConfirmation.title}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600">
                          Recipients: {m.pendingConfirmation.recipient}
                        </div>
                        <div className="rounded-xl border border-blue-100 bg-white p-2.5 text-[11px] text-slate-700">
                          {m.pendingConfirmation.previewText}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleConfirmAction(m)}
                            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-blue-700"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Confirm & Execute
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedConfirmationId(null)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Starter Prompt Chips */}
              <div className="pt-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Starter prompts ({activeRole.replace("_", " ")})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {config.starterChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSendQuery(chip)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 text-left"
                    >
                      {chip}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSendQuery(config.outOfScopeTestChip)}
                    className="rounded-full border border-amber-200 bg-amber-50/70 px-2.5 py-1 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100 text-left"
                  >
                    {activeRole === "clinic_owner"
                      ? "3-Month Break-Even (AR)"
                      : `🔒 Test RBAC: "${config.outOfScopeTestChip.slice(0, 32)}..."`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Input Bar — Exact match to Image 14 ("Ask by text or by voice..." + Blue Mic Button) */}
          <div className="border-t border-slate-100 bg-white p-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-2xs">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendQuery()}
                placeholder="Ask by text or by voice..."
                className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {inputText.trim() ? (
                <button
                  type="button"
                  onClick={() => handleSendQuery()}
                  aria-label="Send query"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (config.voiceAllowed) {
                      setIsVoiceListening((v) => !v);
                      handleSendQuery(config.starterChips[0], true);
                    } else {
                      handleSendQuery(config.starterChips[0], false);
                    }
                  }}
                  aria-label="Voice input"
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 ${
                    isVoiceListening ? "animate-pulse ring-4 ring-blue-200" : ""
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ====================================================================
          CLOSED / LAUNCHER STATE: FLOATING BOTTOM-RIGHT WIDGET (60px × 60px)
          Exact visual match to Reference Image 13
         ==================================================================== */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
        }}
        className="group"
      >
        {/* Role-Adaptive Hover Tooltip */}
        <div className="pointer-events-none absolute bottom-[72px] right-0 whitespace-nowrap rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {config.tooltip}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          aria-label={config.tooltip}
          style={{
            width: "60px",
            height: "60px",
            boxShadow: isVoiceListening
              ? "0 0 0 12px rgba(59, 130, 246, 0.28)"
              : "0 0 0 8px rgba(59, 130, 246, 0.15)",
          }}
          className="relative flex items-center justify-center rounded-full border-2 border-blue-300/80 bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          {/* 14px Emerald-Green Online Status Dot (#10B981) at top-left (top: 2px, left: 2px) */}
          <span
            style={{
              width: "14px",
              height: "14px",
              top: "2px",
              left: "2px",
              backgroundColor: "#10B981",
            }}
            className="absolute rounded-full border-2 border-white shadow-xs"
          />

          {/* Friendly Blue-Themed Headset Assistant Character Avatar — Exact match to Image 13 */}
          <svg
            viewBox="0 0 64 64"
            className="h-13 w-13 overflow-hidden rounded-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ebt-ai-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DBEAFE" />
                <stop offset="100%" stopColor="#93C5FD" />
              </linearGradient>
              <linearGradient id="ebt-ai-hair" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="ebt-ai-shirt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1E40AF" />
              </linearGradient>
            </defs>

            {/* Soft Blue Circle Background */}
            <circle cx="32" cy="32" r="30" fill="url(#ebt-ai-bg)" />

            {/* Shoulders / Blue Shirt */}
            <path
              d="M14 58 C16 46, 48 46, 50 58 Z"
              fill="url(#ebt-ai-shirt)"
            />

            {/* Neck */}
            <rect x="28" y="41" width="8" height="7" rx="3" fill="#FDBA74" />

            {/* Face */}
            <circle cx="32" cy="33" r="12" fill="#FED7AA" />

            {/* Friendly Cheeks */}
            <circle cx="24.5" cy="35.5" r="2" fill="#FB7185" opacity="0.45" />
            <circle cx="39.5" cy="35.5" r="2" fill="#FB7185" opacity="0.45" />

            {/* Eyes */}
            <circle cx="27.5" cy="32.5" r="1.8" fill="#0F172A" />
            <circle cx="36.5" cy="32.5" r="1.8" fill="#0F172A" />
            <circle cx="27" cy="31.9" r="0.6" fill="#FFFFFF" />
            <circle cx="36" cy="31.9" r="0.6" fill="#FFFFFF" />

            {/* Warm Smile */}
            <path
              d="M28.5 37.2 Q32 40.2 35.5 37.2"
              fill="none"
              stroke="#9A3412"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Blue Stylized Hair */}
            <path
              d="M19 31 C18 20, 27 14, 34 15 C42 16, 46 22, 45 31 C42 25, 38 24, 34 27 C31 23, 25 24, 19 31 Z"
              fill="url(#ebt-ai-hair)"
            />

            {/* Headset Arc */}
            <path
              d="M18 32 A14 14 0 0 1 46 32"
              fill="none"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Left & Right Headset Ear Cups */}
            <rect x="15.5" y="29" width="4" height="8" rx="2" fill="#0284C7" stroke="#0F172A" strokeWidth="1.2" />
            <rect x="44.5" y="29" width="4" height="8" rx="2" fill="#0284C7" stroke="#0F172A" strokeWidth="1.2" />

            {/* Headset Boom Microphone */}
            <path
              d="M45 36 Q42 42 35 41"
              fill="none"
              stroke="#0F172A"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="34.5" cy="41" r="2" fill="#2563EB" stroke="#0F172A" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </>
  );
}
