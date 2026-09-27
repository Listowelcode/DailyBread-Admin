"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import SubscriberDetailOverlay from "@/components/admin/SubscriberDetailOverlay";
import PageSkeleton from "@/components/ui/PageSkeleton";
import DialogHost, { showAlert, showConfirm } from "@/components/ui/Dialog";
import {
  ApiRequestError,
  createAnnouncement,
  createJourney,
  deleteSubscriber,
  createMessage,
  deleteAnnouncement,
  deleteJourney,
  deleteMessage,
  generateJourney,
  generateMessage,
  getAdminProfile,
  getAnnouncements,
  getJourney,
  getJourneys,
  getMessages,
  getOverview,
  getSettings,
  getSubscribers,
  journeyAction,
  loginAdmin,
  logoutAdmin,
  messageAction,
  sendAnnouncement,
  updateAnnouncement,
  updateSettings,
} from "@/lib/api";
import type {
  AdminProfile,
  AdminSettings,
  Announcement,
  DailyEmailCount,
  DailyMessage,
  Journey,
  JourneyDetail,
  Subscriber,
} from "@/lib/types";
import { getTimezoneOptions } from "@/lib/timezones";

type View = "dashboard" | "today" | "ai" | "journeys" | "ai-journeys" | "subscribers" | "announcements" | "settings";
type MessageAction = "submit" | "approve" | "unapprove" | "archive";
type JourneyAction = "publish" | "archive";

const today = new Date().toISOString().slice(0, 10);
const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3000";
const inputClass = "w-full rounded-xl border border-black/10 bg-[#fbfaf7] px-3 py-2.5 text-sm text-brand-teal outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10";
const textareaClass = `${inputClass} min-h-28 resize-y`;
const selectClass = `${inputClass} admin-select cursor-pointer pr-9`;

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "approved" || status === "published" || status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "pending_review") return "bg-amber-50 text-amber-700";
  if (status === "archived" || status === "unsubscribed") return "bg-slate-100 text-slate-600";
  return "bg-brand-teal/10 text-brand-teal";
}

function LoginCard({ onLogin }: { onLogin: (session: { access_token: string; full_name: string; email: string }) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session = await loginAdmin(email, password);
      localStorage.setItem("daily-bread-admin-token", session.access_token);
      onLogin(session);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Login failed. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#edf3f1] px-5 py-8 md:px-8"><div className="admin-slate-blob admin-slate-blob-login-one" aria-hidden="true" /><div className="admin-slate-blob admin-slate-blob-login-two" aria-hidden="true" /><div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white shadow-[0_30px_90px_rgba(11,55,59,0.14)] lg:grid-cols-[0.8fr_1.2fr]"><div className="relative hidden min-h-[620px] overflow-hidden bg-brand-teal p-10 text-white lg:flex lg:flex-col lg:justify-between"><div className="admin-slate-blob admin-slate-blob-login-panel" aria-hidden="true" /><img src="/dailybread-lockup.png" alt="Daily Bread" className="relative h-auto w-48 object-contain object-left brightness-0 invert" /><div className="relative"><p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Steward the message</p><h2 className="mt-4 max-w-xs text-4xl font-bold leading-[1.05] tracking-tight">A quiet place to prepare what matters.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-white/65">Manage Today’s Word, spiritual journeys, announcements, and the people walking with Daily Bread.</p></div><p className="relative text-xs text-white/40">Daily Bread · Admin workspace</p></div><div className="p-7 md:p-12"><div className="lg:hidden"><img src="/dailybread-lockup.png" alt="Daily Bread" className="h-auto w-44 object-contain object-left" /></div><div className="mt-8 lg:mt-0"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-rust">Private workspace</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-teal md:text-4xl">Admin sign in</h1><p className="mt-3 max-w-md text-sm leading-6 text-brand-teal/60">Sign in to shape the daily rhythm of scripture, reflection, and encouragement.</p></div><form onSubmit={submit} className="mt-8 space-y-5"><label className="block space-y-2"><span className="text-sm font-medium text-brand-teal">Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputClass} admin-autofill`} autoComplete="username" inputMode="email" /></label><label className="block space-y-2"><span className="text-sm font-medium text-brand-teal">Password</span><span className="relative block"><input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} admin-autofill pr-12`} autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-brand-teal/55 transition hover:text-brand-rust focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-rust/30" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? "◉" : "◌"}</button></span></label>{error && <p className="text-sm text-brand-rust">{error}</p>}<Button disabled={loading} type="submit" className="w-full rounded-xl py-3.5">{loading ? "Signing in…" : "Sign in to admin"}</Button></form><a href={LANDING_URL} className="mt-6 block text-center text-sm text-brand-teal/55 underline underline-offset-4">Back to public site</a></div></div></main>;
}

function Metric({ label, value, detail, pulseKey }: { label: string; value: number | string; detail: string; pulseKey: number }) {
  const numericValue = typeof value === "number" ? value : Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    const duration = 720;
    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(numericValue * eased));
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [numericValue, pulseKey]);

  return <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-teal/45">{label}</p><p className="font-montserrat mt-3 text-3xl text-brand-teal" aria-live="polite">{displayValue.toLocaleString()}</p><p className="mt-1 text-xs text-brand-teal/50">{detail}</p></div>;
}

function EmailDeliveryChart({ data }: { data: DailyEmailCount[] }) {
  const max = Math.max(...data.map((item) => item.count), 1);
  return <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">Emails sent per day</h3><p className="mt-1 text-sm text-brand-teal/55">Successful deliveries during the last seven days.</p></div><span className="text-xs text-brand-teal/45">Daily delivery history</span></div><div className="mt-7 grid h-40 grid-cols-7 items-end gap-2 sm:gap-4">{data.map((item) => <div key={item.date} className="flex h-full flex-col items-center justify-end gap-2"><span className="text-xs font-semibold text-brand-teal">{item.count}</span><div className="w-full rounded-t-lg bg-brand-rust/80 transition-all" style={{ height: `${Math.max((item.count / max) * 100, item.count ? 8 : 2)}%` }} title={`${item.count} emails on ${item.date}`} /><span className="text-[10px] text-brand-teal/45">{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${item.date}T12:00:00Z`))}</span></div>)}</div></div>;
}

function MessageForm({ token, onCreated }: { token: string; onCreated: (message: DailyMessage) => void }) {
  const [form, setForm] = useState({ message_date: today, title: "", scripture_reference: "", message: "", encouragement: "", bible_reading: "", prayer: "", reflection: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const message = await createMessage(token, form);
      onCreated(message);
      setForm({ message_date: today, title: "", scripture_reference: "", message: "", encouragement: "", bible_reading: "", prayer: "", reflection: "" });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not create the message.");
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={submit} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><div className="mb-5"><h2 className="text-lg font-semibold">Create Today’s Word</h2><p className="mt-1 text-sm text-brand-teal/55">Manual messages start as drafts and can be submitted for review.</p></div><div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm font-medium">Date<input required type="date" value={form.message_date} onChange={(event) => update("message_date", event.target.value)} className={inputClass} /></label><label className="space-y-2 text-sm font-medium">Title<input required value={form.title} onChange={(event) => update("title", event.target.value)} className={inputClass} placeholder="A steady hope" /></label><label className="space-y-2 text-sm font-medium md:col-span-2">Scripture reference<input value={form.scripture_reference} onChange={(event) => update("scripture_reference", event.target.value)} className={inputClass} placeholder="Matthew 6:34" /></label><label className="space-y-2 text-sm font-medium md:col-span-2">Message<textarea required value={form.message} onChange={(event) => update("message", event.target.value)} className={textareaClass} /></label><label className="space-y-2 text-sm font-medium">Encouragement<textarea value={form.encouragement} onChange={(event) => update("encouragement", event.target.value)} className={textareaClass} /></label><label className="space-y-2 text-sm font-medium">Prayer<textarea value={form.prayer} onChange={(event) => update("prayer", event.target.value)} className={textareaClass} /></label><label className="space-y-2 text-sm font-medium">Bible reading<textarea value={form.bible_reading} onChange={(event) => update("bible_reading", event.target.value)} className={textareaClass} /></label><label className="space-y-2 text-sm font-medium">Reflection<textarea value={form.reflection} onChange={(event) => update("reflection", event.target.value)} className={textareaClass} /></label></div>{error && <p className="mt-4 text-sm text-brand-rust">{error}</p>}<Button type="submit" disabled={saving} className="mt-5 rounded-xl">{saving ? "Creating…" : "Create draft"}</Button></form>;
}

function AiMessageGenerator({ token, onCreated }: { token: string; onCreated: (message: DailyMessage) => void }) {
  const [messageDate, setMessageDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const message = await generateMessage(token, messageDate);
      onCreated(message);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "AI generation failed.");
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={submit} className="rounded-2xl border border-brand-rust/15 bg-brand-rust/5 p-6 shadow-sm"><h2 className="text-lg font-semibold">Generate Today’s Word with AI</h2><p className="mt-1 text-sm text-brand-teal/60">FastAPI creates the content as <strong>pending review</strong>; it is never approved automatically by this action.</p><div className="mt-5 flex flex-wrap items-end gap-4"><label className="space-y-2 text-sm font-medium">Message date<input required type="date" value={messageDate} onChange={(event) => setMessageDate(event.target.value)} className={inputClass} /></label><Button type="submit" disabled={saving} className="rounded-xl">{saving ? "Generating…" : "Generate with AI"}</Button></div>{error && <p className="mt-4 text-sm text-brand-rust">{error}</p>}</form>;
}

function MessageLibrary({ token, messages, setMessages, aiOnly = false }: { token: string; messages: DailyMessage[]; setMessages: (messages: DailyMessage[]) => void; aiOnly?: boolean }) {
  const [filter, setFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState<DailyMessage | null>(null);
  const source = aiOnly ? messages.filter((message) => message.approval_method === "ai_auto") : messages;
  const filtered = filter === "all" ? source : source.filter((message) => message.status === filter);

  async function runAction(id: string, action: MessageAction) {
    try {
      const updated = await messageAction(token, id, action);
      setMessages(messages.map((message) => message.id === id ? updated : message));
      setSelectedMessage((current) => current?.id === id ? updated : current);
    } catch (err) {
      void showAlert(err instanceof ApiRequestError ? err.message : "The message action failed.", { title: "Action failed" });
    }
  }

  async function remove(id: string) {
    if (!(await showConfirm("Delete this message permanently?", { title: "Delete message", confirmLabel: "Delete", danger: true }))) return;
    try {
      await deleteMessage(token, id);
      setMessages(messages.filter((message) => message.id !== id));
      setSelectedMessage(null);
    } catch (err) {
      void showAlert(err instanceof ApiRequestError ? err.message : "The message could not be deleted.", { title: "Delete failed" });
    }
  }

  return <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{aiOnly ? "AI review queue" : "Today’s Word library"}</h2><p className="mt-1 text-sm text-brand-teal/55">{aiOnly ? "Review AI-created content before it becomes eligible for delivery." : "Review, approve, archive, or remove daily content. Click a card to inspect the full message."}</p></div><select value={filter} onChange={(event) => setFilter(event.target.value)} className={`${selectClass} max-w-48`}><option value="all">All statuses</option><option value="draft">Draft</option><option value="pending_review">Pending review</option><option value="approved">Approved</option><option value="archived">Archived</option></select></div><div className="mt-5 space-y-3">{filtered.length === 0 ? <p className="rounded-xl bg-[#fbfaf7] p-5 text-sm text-brand-teal/55">No messages in this view.</p> : filtered.map((message) => <div key={message.id} role="button" tabIndex={0} onClick={() => setSelectedMessage(message)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedMessage(message); } }} className="admin-library-card cursor-pointer rounded-xl border border-black/5 p-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/30"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-rust">{formatDate(message.message_date)}</p><h3 className="mt-1 font-semibold">{message.title}</h3><p className="mt-1 text-sm text-brand-teal/55">{message.scripture_reference || "No scripture reference"}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(message.status)}`}>{message.status.replace("_", " ")}</span>{message.approval_method === "ai_auto" && <span className="rounded-full bg-brand-rust/10 px-3 py-1 text-xs font-medium text-brand-rust">AI</span>}</div></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-brand-teal/65">{message.message}</p><div onClick={(event) => event.stopPropagation()} className="mt-4 flex flex-wrap gap-2">{message.status === "draft" && <button type="button" onClick={() => runAction(message.id, "submit")} className="admin-action-button rounded-lg bg-brand-teal px-3 py-2 text-xs font-semibold text-white">Submit for review</button>}{(message.status === "draft" || message.status === "pending_review") && <button type="button" onClick={() => runAction(message.id, "approve")} className="admin-action-button rounded-lg border border-brand-teal/20 px-3 py-2 text-xs font-semibold text-brand-teal">Approve</button>}{message.status === "approved" && <button type="button" onClick={() => runAction(message.id, "unapprove")} className="admin-action-button rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700">Return to draft</button>}{message.status !== "sent" && message.status !== "archived" && <button type="button" onClick={() => runAction(message.id, "archive")} className="admin-action-button rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-brand-teal/65">Archive</button>}{message.status !== "sent" && <button type="button" onClick={() => remove(message.id)} className="admin-action-button rounded-lg border border-brand-rust/20 px-3 py-2 text-xs font-semibold text-brand-rust">Delete</button>}</div></div>)}</div>{selectedMessage && <div className="admin-overlay-backdrop fixed inset-0 z-50 flex items-center justify-center bg-brand-teal/40 p-4 backdrop-blur-sm" onClick={() => setSelectedMessage(null)} role="presentation"><div className="admin-overlay-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={selectedMessage.title}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-rust">{formatDate(selectedMessage.message_date)}</p><h3 className="mt-1 text-2xl font-semibold text-brand-teal">{selectedMessage.title}</h3><p className="mt-2 text-sm text-brand-teal/55">{selectedMessage.scripture_reference || "No scripture reference"} · {selectedMessage.status.replace("_", " ")}</p></div><button type="button" onClick={() => setSelectedMessage(null)} className="admin-action-button rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-brand-teal/70">Close</button></div><div className="mt-6 space-y-5 text-sm leading-7 text-brand-teal/75"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal/45">Message</p><p className="whitespace-pre-line">{selectedMessage.message}</p></div>{selectedMessage.encouragement && <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal/45">Encouragement</p><p className="whitespace-pre-line">{selectedMessage.encouragement}</p></div>}{selectedMessage.bible_reading && <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal/45">Bible reading</p><p className="whitespace-pre-line">{selectedMessage.bible_reading}</p></div>}{selectedMessage.prayer && <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal/45">Prayer</p><p className="whitespace-pre-line">{selectedMessage.prayer}</p></div>}{selectedMessage.reflection && <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal/45">Reflection</p><p className="whitespace-pre-line">{selectedMessage.reflection}</p></div>}</div></div></div>}</div>;
}

function JourneyForm({ token, onCreated }: { token: string; onCreated: (journey: Journey) => void }) {
  const [form, setForm] = useState({ title: "", description: "", category: "", duration_days: 7 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(null); try { const journey = await createJourney(token, form); onCreated(journey); setForm({ title: "", description: "", category: "", duration_days: 7 }); } catch (err) { setError(err instanceof ApiRequestError ? err.message : "Could not create the journey."); } finally { setSaving(false); } }
  return <form onSubmit={submit} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Create a journey manually</h2><p className="mt-1 text-sm text-brand-teal/55">Create the journey shell, then add all required days through the journey management API before publishing.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm font-medium md:col-span-2">Title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} /></label><label className="space-y-2 text-sm font-medium md:col-span-2">Description<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={textareaClass} /></label><label className="space-y-2 text-sm font-medium">Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass} /></label><label className="space-y-2 text-sm font-medium">Duration in days<input required min={1} max={365} type="number" value={form.duration_days} onChange={(event) => setForm({ ...form, duration_days: Number(event.target.value) })} className={inputClass} /></label></div>{error && <p className="mt-4 text-sm text-brand-rust">{error}</p>}<Button disabled={saving} type="submit" className="mt-5 rounded-xl">{saving ? "Creating…" : "Create draft journey"}</Button></form>;
}

function AiJourneyGenerator({ token, onCreated }: { token: string; onCreated: (journey: Journey) => void }) {
  const [form, setForm] = useState({ title: "", category: "", duration_days: 7, theme: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(null); try { const journey = await generateJourney(token, form); onCreated(journey); setForm({ title: "", category: "", duration_days: 7, theme: "" }); } catch (err) { setError(err instanceof ApiRequestError ? err.message : "AI journey generation failed."); } finally { setSaving(false); } }
  return <form onSubmit={submit} className="rounded-2xl border border-brand-rust/15 bg-brand-rust/5 p-6 shadow-sm"><h2 className="text-lg font-semibold">Generate a journey with AI</h2><p className="mt-1 text-sm text-brand-teal/60">FastAPI generates the complete journey and saves it as a draft. Review it before publishing.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm font-medium">Title/theme<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} placeholder="Hope in difficult seasons" /></label><label className="space-y-2 text-sm font-medium">Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass} placeholder="Hope" /></label><label className="space-y-2 text-sm font-medium">Duration in days<input required min={1} max={90} type="number" value={form.duration_days} onChange={(event) => setForm({ ...form, duration_days: Number(event.target.value) })} className={inputClass} /></label><label className="space-y-2 text-sm font-medium">Additional focus<input value={form.theme} onChange={(event) => setForm({ ...form, theme: event.target.value })} className={inputClass} placeholder="Prayer, patience, and trust" /></label></div>{error && <p className="mt-4 text-sm text-brand-rust">{error}</p>}<Button disabled={saving} type="submit" className="mt-5 rounded-xl">{saving ? "Generating…" : "Generate journey with AI"}</Button></form>;
}

function JourneyLibrary({ token, journeys, setJourneys, draftOnly = false }: { token: string; journeys: Journey[]; setJourneys: (journeys: Journey[]) => void; draftOnly?: boolean }) {
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [detail, setDetail] = useState<JourneyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const visible = draftOnly ? journeys.filter((journey) => journey.status === "draft") : journeys;

  async function openJourney(journey: Journey) {
    setSelectedJourney(journey);
    setDetail(null);
    setActiveDay(0);
    setDetailLoading(true);
    try {
      const loaded = await getJourney(token, journey.id);
      setDetail(loaded);
    } catch (err) {
      void showAlert(err instanceof ApiRequestError ? err.message : "The journey details could not be loaded.", { title: "Could not load journey" });
    } finally {
      setDetailLoading(false);
    }
  }

  async function runAction(id: string, action: JourneyAction) {
    try {
      const updated = await journeyAction(token, id, action);
      const next = journeys.map((journey) => journey.id === id ? { ...journey, ...updated } : journey);
      setJourneys(next);
      setSelectedJourney((current) => current?.id === id ? next.find((journey) => journey.id === id) ?? current : current);
      setDetail((current) => current?.id === id ? { ...current, ...updated } : current);
    } catch (err) {
      void showAlert(err instanceof ApiRequestError ? err.message : "The journey action failed.", { title: "Action failed" });
    }
  }

  async function remove(id: string) {
    if (!(await showConfirm("Delete this journey permanently?", { title: "Delete journey", confirmLabel: "Delete", danger: true }))) return;
    try {
      await deleteJourney(token, id);
      setJourneys(journeys.filter((journey) => journey.id !== id));
      setSelectedJourney(null);
      setDetail(null);
    } catch (err) {
      void showAlert(err instanceof ApiRequestError ? err.message : "The journey could not be deleted.", { title: "Delete failed" });
    }
  }

  const displayed = detail ?? selectedJourney;
  const days = detail?.days ?? [];
  const currentDay = days[activeDay];

  return <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
    <div>
      <h2 className="text-lg font-semibold">{draftOnly ? "AI journey review queue" : "Journey library"}</h2>
      <p className="mt-1 text-sm text-brand-teal/55">{draftOnly ? "Draft journeys are reviewed here. Open a journey to inspect every generated day before publishing." : "Publish or archive journeys through the protected FastAPI actions. Click a card to inspect its details."}</p>
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {visible.length === 0 ? <p className="text-sm text-brand-teal/55">{draftOnly ? "No draft journeys waiting for review." : "No journeys yet."}</p> : visible.map((journey) => <div key={journey.id} role="button" tabIndex={0} onClick={() => void openJourney(journey)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openJourney(journey); } }} className="admin-library-card cursor-pointer rounded-xl border border-black/5 p-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/30">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{journey.title}</h3><p className="mt-1 text-sm text-brand-teal/55">{journey.duration_days} days{journey.category ? ` · ${journey.category}` : ""}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(journey.status)}`}>{journey.status}</span></div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-brand-teal/60">{journey.description}</p>
        <p className="mt-4 text-xs text-brand-teal/45">Created {formatDate(journey.created_at)}</p>
        <div onClick={(event) => event.stopPropagation()} className="mt-4 flex flex-wrap gap-2">{journey.status === "draft" && <button type="button" onClick={() => void runAction(journey.id, "publish")} className="admin-action-button rounded-lg bg-brand-teal px-3 py-2 text-xs font-semibold text-white">Publish</button>}{journey.status !== "archived" && <button type="button" onClick={() => void runAction(journey.id, "archive")} className="admin-action-button rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-brand-teal/65">Archive</button>}{journey.status !== "published" && <button type="button" onClick={() => void remove(journey.id)} className="admin-action-button rounded-lg border border-brand-rust/20 px-3 py-2 text-xs font-semibold text-brand-rust">Delete</button>}</div>
      </div>)}
    </div>
    {selectedJourney && <div className="admin-overlay-backdrop fixed inset-0 z-50 flex items-center justify-center bg-brand-teal/40 p-4 backdrop-blur-sm" onClick={() => { setSelectedJourney(null); setDetail(null); }} role="presentation">
      <div className="admin-overlay-panel max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={selectedJourney.title}>
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-rust">{selectedJourney.category || "Spiritual journey"}</p><h3 className="mt-1 text-2xl font-semibold text-brand-teal">{selectedJourney.title}</h3><p className="mt-2 text-sm text-brand-teal/55">{selectedJourney.duration_days} days · {selectedJourney.status} · Created {formatDate(selectedJourney.created_at)}</p></div><button type="button" onClick={() => { setSelectedJourney(null); setDetail(null); }} className="admin-action-button rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-brand-teal/70">Close</button></div>
        {detailLoading && <div className="mt-6 rounded-xl bg-[#fbfaf7] p-8 text-center text-sm text-brand-teal/55">Loading every day of this journey…</div>}
        {!detailLoading && displayed && <>
          <div className="mt-6 rounded-xl bg-[#fbfaf7] p-5 text-sm leading-7 text-brand-teal/75"><p className="whitespace-pre-line">{displayed.description}</p></div>
          {detail && days.length > 0 && <div className="mt-6 overflow-hidden rounded-2xl border border-brand-teal/10 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-rust">Journey day {activeDay + 1} of {days.length}</p><p className="mt-1 text-sm text-brand-teal/50">Use the arrows below to review the complete AI-generated sequence.</p></div><span className="rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-semibold text-brand-teal">{currentDay?.scripture_reference || "Daily practice"}</span></div>
            <div className="journey-day-viewport overflow-hidden"><div className="journey-day-track flex" style={{ transform: `translateX(-${activeDay * 100}%)` }}>{days.map((day) => <article key={day.id} className="min-w-full p-6 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-rust">Day {day.day_number}</p><h4 className="mt-2 text-2xl font-semibold text-brand-teal">{day.title}</h4></div>{day.scripture_reference && <span className="rounded-full border border-brand-rust/20 px-3 py-1 text-xs font-semibold text-brand-rust">{day.scripture_reference}</span>}</div><div className="mt-6 grid gap-5 md:grid-cols-2"><div className="rounded-xl bg-[#fbfaf7] p-5 md:col-span-2"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-teal/45">Lesson</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-brand-teal/75">{day.lesson}</p></div>{day.encouragement && <div className="rounded-xl border border-brand-rust/15 bg-brand-rust/5 p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-rust">Encouragement</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-brand-teal/70">{day.encouragement}</p></div>}{day.bible_reading && <div className="rounded-xl border border-brand-teal/10 bg-brand-teal/5 p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-teal/55">Bible reading</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-brand-teal/70">{day.bible_reading}</p></div>}{day.prayer && <div className="rounded-xl border border-brand-teal/10 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-teal/55">Prayer</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-brand-teal/70">{day.prayer}</p></div>}{day.reflection && <div className="rounded-xl border border-black/5 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-teal/55">Reflection</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-brand-teal/70">{day.reflection}</p></div>}</div></article>)}</div></div>
            <div className="flex items-center justify-between border-t border-black/5 px-5 py-4"><button type="button" disabled={activeDay === 0} onClick={() => setActiveDay((current) => Math.max(0, current - 1))} className="admin-action-button inline-flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-brand-teal disabled:cursor-not-allowed disabled:opacity-35"><span aria-hidden="true">←</span> Previous day</button><div className="flex items-center gap-1.5" aria-label="Journey day navigation">{days.map((day, index) => <button key={day.id} type="button" onClick={() => setActiveDay(index)} aria-label={`Go to day ${day.day_number}`} aria-current={index === activeDay ? "step" : undefined} className={`h-1.5 rounded-full transition-all ${index === activeDay ? "w-8 bg-brand-rust" : "w-1.5 bg-brand-teal/15 hover:bg-brand-rust/50"}`} />)}</div><button type="button" disabled={activeDay === days.length - 1} onClick={() => setActiveDay((current) => Math.min(days.length - 1, current + 1))} className="admin-action-button inline-flex items-center gap-2 rounded-lg bg-brand-teal px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35">Next day <span aria-hidden="true">→</span></button></div>
          </div>}
          {detail && detail.sources.length > 0 && <div className="mt-5 rounded-xl border border-black/5 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-teal/45">Sources</p><div className="mt-3 space-y-2">{detail.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block text-sm text-brand-teal underline decoration-brand-rust/30 underline-offset-4 hover:text-brand-rust">{source.title}</a>)}</div></div>}
          <div className="mt-6 flex flex-wrap gap-2">{selectedJourney.status === "draft" && <button type="button" onClick={() => void runAction(selectedJourney.id, "publish")} className="admin-action-button rounded-lg bg-brand-teal px-3 py-2 text-xs font-semibold text-white">Publish journey</button>}{selectedJourney.status !== "archived" && <button type="button" onClick={() => void runAction(selectedJourney.id, "archive")} className="admin-action-button rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-brand-teal/65">Archive journey</button>}{selectedJourney.status !== "published" && <button type="button" onClick={() => void remove(selectedJourney.id)} className="admin-action-button rounded-lg border border-brand-rust/20 px-3 py-2 text-xs font-semibold text-brand-rust">Delete journey</button>}</div>
        </>}
      </div>
    </div>}
  </div>;
}

function SubscribersSection({ token }: { token: string }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState({ page: 1, page_size: 25, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage((current) => ({ ...current, page: 1 })); }, 300); return () => window.clearTimeout(timer); }, [searchInput]);
  useEffect(() => { if (!selectedSubscriber) return; const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedSubscriber(null); }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [selectedSubscriber]);
  useEffect(() => { let active = true; setLoading(true); setError(null); getSubscribers(token, page.page, page.page_size, search).then((result) => { if (!active) return; setSubscribers(result.subscribers); setPage({ page: result.page, page_size: result.page_size, total: result.total, total_pages: result.total_pages }); }).catch((err) => { if (active) setError(err instanceof ApiRequestError ? err.message : "Could not load subscribers."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [token, page.page, page.page_size, search, reloadNonce]);
  async function removeSubscriber() {
    if (!selectedSubscriber) return;
    const deletedId = selectedSubscriber.id;
    await deleteSubscriber(token, deletedId);
    setSubscribers((current) => current.filter((subscriber) => subscriber.id !== deletedId));
    setSelectedSubscriber(null);
    setPage((current) => ({ ...current, page: current.page > 1 && subscribers.length === 1 ? current.page - 1 : current.page, total: Math.max(0, current.total - 1) }));
    setReloadNonce((current) => current + 1);
  }
  return <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">All subscribers</h2><p className="mt-1 text-sm text-brand-teal/55">Search by name or email and browse large lists page by page.</p></div><span className="rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-semibold text-brand-teal">{page.total} matching users</span></div><div className="mt-5 flex flex-wrap items-center gap-3"><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className={`${inputClass} min-w-[240px] flex-1`} placeholder="Search name or email…" aria-label="Search subscribers" /><label className="flex items-center gap-2 text-sm text-brand-teal/60"><span>Rows</span><select value={page.page_size} onChange={(event) => setPage((current) => ({ ...current, page: 1, page_size: Number(event.target.value) }))} className={`${selectClass} w-24`}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label></div>{error && <p className="mt-4 text-sm text-brand-rust">{error}</p>}{loading && <p className="mt-4 text-sm text-brand-teal/50">Loading subscribers…</p>}<div className="mt-5 overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b border-black/5 text-xs uppercase tracking-[0.12em] text-brand-teal/45"><tr><th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Email</th><th className="pb-3 pr-4">Status</th><th className="pb-3 pr-4">Joined</th><th className="pb-3 pr-4">Last active</th><th className="pb-3 pr-4">Delivery</th><th className="pb-3">Journeys</th></tr></thead><tbody>{subscribers.map((subscriber) => <tr key={subscriber.id} role="button" tabIndex={0} onClick={() => setSelectedSubscriber(subscriber)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedSubscriber(subscriber); } }} className="admin-subscriber-row cursor-pointer border-b border-black/5 align-top outline-none last:border-0"><td className="py-4 pr-4"><p className="font-medium">{subscriber.full_name}</p><p className="mt-1 text-xs text-brand-teal/45">{subscriber.timezone}</p></td><td className="py-4 pr-4 text-brand-teal/65">{subscriber.email}</td><td className="py-4 pr-4"><span className={`rounded-full px-2.5 py-1 text-xs ${statusClass(subscriber.status || "active")}`}>{subscriber.status || "active"}</span></td><td className="py-4 pr-4 text-brand-teal/65">{formatDate(subscriber.created_at)}</td><td className="py-4 pr-4 text-brand-teal/65">{formatDate(subscriber.last_active_at)}</td><td className="py-4 pr-4 text-xs text-brand-teal/60"><p>{subscriber.todays_word_enabled ? `Today’s Word${subscriber.todays_word_time ? ` · ${subscriber.todays_word_time}` : ""}` : "Today’s Word off"}</p><p className="mt-1">{subscriber.spiritual_journey_enabled ? `Journeys${subscriber.spiritual_journey_time ? ` · ${subscriber.spiritual_journey_time}` : ""}` : "Journeys off"}</p></td><td className="py-4 text-xs text-brand-teal/65">{subscriber.journey_enrollments?.length ? <div className="space-y-2">{subscriber.journey_enrollments.map((enrollment) => <div key={enrollment.id}><p className="font-medium text-brand-teal">{enrollment.journey_title}</p><p>{enrollment.status} · day {enrollment.current_day}</p></div>)}</div> : <span className="text-brand-teal/40">None</span>}</td></tr>)}</tbody></table>{!loading && subscribers.length === 0 && <p className="py-5 text-sm text-brand-teal/50">No users match this search.</p>}</div>{selectedSubscriber && <SubscriberDetailOverlay subscriber={selectedSubscriber} onClose={() => setSelectedSubscriber(null)} onDelete={removeSubscriber} />}
{page.total > 0 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4"><p className="text-xs text-brand-teal/50">Showing {((page.page - 1) * page.page_size) + 1}–{Math.min(page.page * page.page_size, page.total)} of {page.total}</p><div className="flex items-center gap-2"><button type="button" disabled={page.page <= 1} onClick={() => setPage((current) => ({ ...current, page: current.page - 1 }))} className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="text-xs text-brand-teal/60">Page {page.page} of {page.total_pages}</span><button type="button" disabled={page.page >= page.total_pages} onClick={() => setPage((current) => ({ ...current, page: current.page + 1 }))} className="rounded-lg bg-brand-teal px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>}</div>;
}

function SettingsSection({ token, settings, setSettings }: { token: string; settings: AdminSettings | null; setSettings: (settings: AdminSettings) => void }) {
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);
  const [draft, setDraft] = useState<AdminSettings | null>(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => setDraft(settings), [settings]);
  if (!draft) return <div className="rounded-2xl bg-white p-6 text-sm text-brand-teal/55">Loading settings…</div>;
  const toggle = (key: keyof AdminSettings) => setDraft({ ...draft, [key]: !draft[key] });
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setMessage(null); try { const updated = await updateSettings(token, { site_name: draft!.site_name, default_timezone: draft!.default_timezone, todays_word_enabled: draft!.todays_word_enabled, default_todays_word_time: draft!.default_todays_word_time, ai_daily_generation_enabled: draft!.ai_daily_generation_enabled, ai_daily_auto_approval: draft!.ai_daily_auto_approval, spiritual_journey_generation_enabled: draft!.spiritual_journey_generation_enabled, default_spiritual_journey_time: draft!.default_spiritual_journey_time, journey_manual_approval_required: draft!.journey_manual_approval_required, journey_generation_interval_days: draft!.journey_generation_interval_days, welcome_email_enabled: draft!.welcome_email_enabled, journey_completion_email_enabled: draft!.journey_completion_email_enabled }); setSettings(updated); setMessage("Settings saved."); } catch (err) { setMessage(err instanceof ApiRequestError ? err.message : "Settings could not be saved."); } finally { setSaving(false); } }
  const options: Array<[keyof AdminSettings, string]> = [["todays_word_enabled", "Enable Today’s Word"], ["ai_daily_generation_enabled", "Enable AI message generation"], ["ai_daily_auto_approval", "Allow AI auto-approval"], ["spiritual_journey_generation_enabled", "Enable journey generation"], ["journey_manual_approval_required", "Require manual journey approval"], ["welcome_email_enabled", "Send welcome emails"], ["journey_completion_email_enabled", "Send journey completion emails"]];
  return <form onSubmit={submit} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Settings</h2><p className="mt-1 text-sm text-brand-teal/55">These values map directly to the protected admin settings endpoint.</p><div className="mt-6 grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm font-medium">Site name<input value={draft.site_name} onChange={(event) => setDraft({ ...draft, site_name: event.target.value })} className={inputClass} /></label><label className="space-y-2 text-sm font-medium">Default timezone<select value={draft.default_timezone || "UTC"} onChange={(event) => setDraft({ ...draft, default_timezone: event.target.value })} className={selectClass}>{timezoneOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><span className="block text-xs font-normal text-brand-teal/45">Announcements and any subscriber without a personal timezone use this clock. Each subscriber&apos;s own Today&apos;s Word and Journey emails still send in their own chosen timezone.</span></label><label className="space-y-2 text-sm font-medium">Today&apos;s Word time<input type="time" value={draft.default_todays_word_time} onChange={(event) => setDraft({ ...draft, default_todays_word_time: event.target.value })} className={inputClass} /></label><label className="space-y-2 text-sm font-medium">Journey time<input type="time" value={draft.default_spiritual_journey_time} onChange={(event) => setDraft({ ...draft, default_spiritual_journey_time: event.target.value })} className={inputClass} /></label><label className="space-y-2 text-sm font-medium">Journey generation interval (days)<input min={1} max={365} type="number" value={draft.journey_generation_interval_days} onChange={(event) => setDraft({ ...draft, journey_generation_interval_days: Number(event.target.value) })} className={inputClass} /></label></div><div className="mt-6 grid gap-3 md:grid-cols-2">{options.map(([key, label]) => <div key={key} className="flex items-center justify-between rounded-xl border border-black/5 bg-[#fbfaf7] px-4 py-3 text-sm"><span>{label}</span><button type="button" role="switch" aria-checked={Boolean(draft[key])} aria-label={label} onClick={() => toggle(key)} className={`admin-toggle ${draft[key] ? "is-on" : ""}`}><span className="admin-toggle-thumb" /></button></div>)}</div>{message && <p className={`mt-4 text-sm ${message === "Settings saved." ? "text-emerald-700" : "text-brand-rust"}`}>{message}</p>}<Button disabled={saving} type="submit" className="mt-6 rounded-xl">{saving ? "Saving…" : "Save settings"}</Button></form>;
}

function AnnouncementSection({ token }: { token: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState({ page: 1, page_size: 25, total: 0, total_pages: 0 });
  const [form, setForm] = useState({ title: "", body: "", scheduled_at: "" });
  const [editForm, setEditForm] = useState({ title: "", body: "", scheduled_at: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage((current) => ({ ...current, page: 1 }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getAnnouncements(token, page.page, page.page_size, search)
      .then((result) => {
        if (!active) return;
        setAnnouncements(result.announcements);
        setPage({ page: result.page, page_size: result.page_size, total: result.total, total_pages: result.total_pages });
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiRequestError ? err.message : "Could not load announcements.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token, page.page, page.page_size, search]);

  // Scheduled announcements are dispatched by the backend every minute. Keep
  // the visible history in sync while the admin workspace remains open.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      getAnnouncements(token, page.page, page.page_size, search)
        .then((result) => {
          setAnnouncements(result.announcements);
          setPage({ page: result.page, page_size: result.page_size, total: result.total, total_pages: result.total_pages });
        })
        .catch(() => {
          // The primary load effect owns visible errors; background polling is best effort.
        });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [token, page.page, page.page_size, search]);

  useEffect(() => {
    if (!selectedAnnouncement) return;
    setEditForm({
      title: selectedAnnouncement.title,
      body: selectedAnnouncement.body,
      scheduled_at: selectedAnnouncement.scheduled_at ? new Date(selectedAnnouncement.scheduled_at).toISOString().slice(0, 16) : "",
    });
    setEditing(false);
  }, [selectedAnnouncement]);

  useEffect(() => {
    if (!selectedAnnouncement) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedAnnouncement(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedAnnouncement]);

  function isoOrNull(value: string) {
    if (!value) return null;
    // datetime-local has no timezone. The form explicitly labels this field
    // UTC, so append Z instead of letting the browser reinterpret local time.
    return new Date(`${value}:00Z`).toISOString();
  }

  function replaceAnnouncement(updated: Announcement) {
    setAnnouncements((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelectedAnnouncement((current) => current?.id === updated.id ? updated : current);
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const created = await createAnnouncement(token, { title: form.title.trim(), body: form.body.trim(), scheduled_at: isoOrNull(form.scheduled_at) });
      setAnnouncements((current) => [created, ...current]);
      setPage((current) => ({ ...current, total: current.total + 1 }));
      setForm({ title: "", body: "", scheduled_at: "" });
      setNotice(created.status === "scheduled" ? "Announcement scheduled." : "Draft saved. Review it below when you are ready to send.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Announcement could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!selectedAnnouncement) return;
    setWorkingId(selectedAnnouncement.id);
    setError(null);
    try {
      const updated = await updateAnnouncement(token, selectedAnnouncement.id, { title: editForm.title.trim(), body: editForm.body.trim(), scheduled_at: isoOrNull(editForm.scheduled_at) });
      replaceAnnouncement(updated);
      setEditing(false);
      setNotice("Announcement updated.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Announcement could not be updated.");
    } finally {
      setWorkingId(null);
    }
  }

  async function sendSelected() {
    if (!selectedAnnouncement) return;
    if (!(await showConfirm("Send this announcement to every active subscriber now?", { title: "Send announcement", confirmLabel: "Send now" }))) return;
    setWorkingId(selectedAnnouncement.id);
    setError(null);
    try {
      const updated = await sendAnnouncement(token, selectedAnnouncement.id);
      replaceAnnouncement(updated);
      setEditing(false);
      if (updated.emails_sent_count > 0) {
        setNotice(`${updated.emails_sent_count.toLocaleString()} emails sent successfully.`);
      } else if (updated.status === "scheduled") {
        setNotice("No emails were accepted yet. The scheduled announcement remains queued for the next delivery check.");
      } else {
        setNotice("No emails were sent. The announcement remains available to retry; check the backend Mailjet configuration and active subscribers.");
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Announcement could not be sent.");
    } finally {
      setWorkingId(null);
    }
  }

  async function removeSelected() {
    if (!selectedAnnouncement) return;
    if (!(await showConfirm("Delete this announcement from history permanently? This cannot be undone.", { title: "Delete announcement", confirmLabel: "Delete", danger: true }))) return;
    setWorkingId(selectedAnnouncement.id);
    setError(null);
    try {
      await deleteAnnouncement(token, selectedAnnouncement.id);
      setAnnouncements((current) => current.filter((item) => item.id !== selectedAnnouncement.id));
      setPage((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
      setSelectedAnnouncement(null);
      setNotice("Announcement removed from history.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Announcement could not be deleted.");
    } finally {
      setWorkingId(null);
    }
  }

  return <div className="space-y-6">
    <form onSubmit={create} className="relative overflow-hidden rounded-2xl border border-brand-rust/15 bg-white p-6 shadow-sm md:p-7">
      <div className="admin-slate-blob admin-slate-blob-one" aria-hidden="true" />
      <div className="admin-slate-blob admin-slate-blob-two" aria-hidden="true" />
      <div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-rust">Audience note</p><h2 className="mt-2 text-2xl font-semibold text-brand-teal">Compose an announcement</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-brand-teal/60">Write a warm, Scripture-centered message for the Daily Bread community. Send it immediately or choose a UTC delivery time for the background scheduler.</p></div>
      <div className="relative mt-6 grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm font-medium">Subject / title<input required minLength={2} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} placeholder="A gentle word for the week" /></label><label className="space-y-2 text-sm font-medium">Schedule (optional, UTC)<input type="datetime-local" value={form.scheduled_at} onChange={(event) => setForm((current) => ({ ...current, scheduled_at: event.target.value }))} className={inputClass} /></label><label className="space-y-2 text-sm font-medium md:col-span-2">Message body<textarea required minLength={2} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} className={`${textareaClass} min-h-40`} placeholder="Share the update, invitation, or encouragement…" /></label></div>
      {error && <p className="relative mt-4 text-sm text-brand-rust">{error}</p>}
      <div className="relative mt-5 flex flex-wrap items-center gap-3"><Button type="submit" disabled={saving} className="rounded-xl">{saving ? "Saving…" : form.scheduled_at ? "Schedule announcement" : "Save as draft"}</Button><p className="text-xs text-brand-teal/45">Only active subscribers receive announcements.</p></div>
    </form>

    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm md:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-rust">Past messages</p><h2 className="mt-2 text-2xl font-semibold text-brand-teal">Announcement history</h2><p className="mt-2 text-sm text-brand-teal/55">Every message keeps its delivery time and successful recipient count.</p></div><span className="rounded-full bg-brand-teal/10 px-3 py-1.5 text-xs font-semibold text-brand-teal">{page.total} total</span></div><div className="mt-5 flex flex-wrap items-center gap-3"><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className={`${inputClass} min-w-[240px] flex-1`} placeholder="Search announcement titles or messages…" aria-label="Search announcements" /><label className="flex items-center gap-2 text-sm text-brand-teal/60"><span>Rows</span><select value={page.page_size} onChange={(event) => setPage((current) => ({ ...current, page: 1, page_size: Number(event.target.value) }))} className={`${selectClass} w-24`}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label></div>{notice && <p className="mt-4 rounded-xl bg-brand-teal/5 px-4 py-3 text-sm text-brand-teal">{notice}</p>}{loading && <p className="mt-4 text-sm text-brand-teal/50">Loading announcement history…</p>}<div className="mt-5 space-y-3">{!loading && announcements.length === 0 ? <p className="rounded-xl bg-[#fbfaf7] p-6 text-sm text-brand-teal/55">No announcements yet. Your first community note can begin here.</p> : announcements.map((announcement) => <button key={announcement.id} type="button" onClick={() => setSelectedAnnouncement(announcement)} className="admin-announcement-row w-full rounded-xl border border-black/5 p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/30"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold text-brand-teal">{announcement.title}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(announcement.status)}`}>{announcement.status}</span></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-brand-teal/60">{announcement.body}</p></div><div className="shrink-0 text-right text-xs text-brand-teal/45"><p>{announcement.sent_at ? `Sent ${formatDateTime(announcement.sent_at)}` : announcement.scheduled_at ? `Scheduled ${formatDateTime(announcement.scheduled_at)}` : `Created ${formatDate(announcement.created_at)}`}</p><p className="mt-2 font-semibold text-brand-rust">{announcement.emails_sent_count.toLocaleString()} emails sent</p></div></div></button>)}</div>{page.total > 0 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4"><p className="text-xs text-brand-teal/50">Showing {((page.page - 1) * page.page_size) + 1}–{Math.min(page.page * page.page_size, page.total)} of {page.total}</p><div className="flex items-center gap-2"><button type="button" disabled={page.page <= 1} onClick={() => setPage((current) => ({ ...current, page: current.page - 1 }))} className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="text-xs text-brand-teal/60">Page {page.page} of {page.total_pages}</span><button type="button" disabled={page.page >= page.total_pages} onClick={() => setPage((current) => ({ ...current, page: current.page + 1 }))} className="rounded-lg bg-brand-teal px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>}</section>

    {selectedAnnouncement && <div className="admin-overlay-backdrop fixed inset-0 z-50 flex items-center justify-center bg-brand-teal/40 p-4 backdrop-blur-sm" onClick={() => setSelectedAnnouncement(null)} role="presentation"><div className="admin-overlay-panel relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={selectedAnnouncement.title}><div className="admin-slate-blob admin-slate-blob-detail" aria-hidden="true" /><div className="relative flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-rust">Community announcement</p><h3 className="mt-2 text-2xl font-semibold text-brand-teal">{selectedAnnouncement.title}</h3><p className="mt-2 text-sm text-brand-teal/50">Created {formatDateTime(selectedAnnouncement.created_at)}</p></div><button type="button" onClick={() => setSelectedAnnouncement(null)} className="admin-action-button rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-brand-teal/70">Close</button></div><div className="relative mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-brand-teal/5 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-teal/45">Status</p><p className="mt-2 text-sm font-semibold capitalize text-brand-teal">{selectedAnnouncement.status}</p></div><div className="rounded-xl bg-brand-rust/5 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-rust/55">Emails sent</p><p className="mt-2 text-lg font-semibold text-brand-rust">{selectedAnnouncement.emails_sent_count.toLocaleString()}</p></div><div className="rounded-xl bg-[#fbfaf7] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-teal/45">{selectedAnnouncement.sent_at ? "Sent at" : "Scheduled for"}</p><p className="mt-2 text-sm font-semibold text-brand-teal">{formatDateTime(selectedAnnouncement.sent_at || selectedAnnouncement.scheduled_at)}</p></div></div>{editing && selectedAnnouncement.status !== "sent" ? <div className="relative mt-6 space-y-4"><label className="space-y-2 text-sm font-medium">Title<input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} /></label><label className="space-y-2 text-sm font-medium">Schedule (optional, UTC)<input type="datetime-local" value={editForm.scheduled_at} onChange={(event) => setEditForm((current) => ({ ...current, scheduled_at: event.target.value }))} className={inputClass} /></label><label className="space-y-2 text-sm font-medium">Message body<textarea value={editForm.body} onChange={(event) => setEditForm((current) => ({ ...current, body: event.target.value }))} className={`${textareaClass} min-h-44`} /></label></div> : <div className="relative mt-6 rounded-2xl bg-[#fbfaf7] p-6"><p className="whitespace-pre-line text-[15px] leading-7 text-brand-teal/75">{selectedAnnouncement.body}</p></div>}{error && <p className="relative mt-4 text-sm text-brand-rust">{error}</p>}<div className="relative mt-6 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{selectedAnnouncement.status !== "sent" && <>{editing ? <button type="button" disabled={workingId === selectedAnnouncement.id} onClick={() => void saveEdit()} className="admin-action-button rounded-lg bg-brand-teal px-3 py-2 text-xs font-semibold text-white">{workingId === selectedAnnouncement.id ? "Saving…" : "Save changes"}</button> : <button type="button" onClick={() => setEditing(true)} className="admin-action-button rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-brand-teal">Edit</button>}</>}{selectedAnnouncement.status !== "sent" && <button type="button" disabled={workingId === selectedAnnouncement.id} onClick={() => void sendSelected()} className="admin-action-button rounded-lg bg-brand-rust px-3 py-2 text-xs font-semibold text-white">{workingId === selectedAnnouncement.id ? "Sending…" : "Send now"}</button>}<button type="button" disabled={workingId === selectedAnnouncement.id} onClick={() => void removeSelected()} className="admin-action-button rounded-lg border border-brand-rust/20 px-3 py-2 text-xs font-semibold text-brand-rust">Delete announcement</button></div><p className="text-xs text-brand-teal/45">{selectedAnnouncement.status === "sent" ? "Delivery is complete and this record is read-only." : "Sends to active subscribers only."}</p></div></div></div>}
  </div>;
}

export default function AdminShell() {
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total_subscribers: 0, active_subscribers: 0, new_this_week: 0, total_messages: 0, pending_messages: 0, total_journeys: 0, published_journeys: 0, emails_sent_today: 0, total_journey_enrollments: 0, active_journey_enrollments: 0 });
  const [emailsSentByDay, setEmailsSentByDay] = useState<DailyEmailCount[]>([]);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [recentSubscribers, setRecentSubscribers] = useState<Subscriber[]>([]);
  const [messages, setMessages] = useState<DailyMessage[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => { const stored = localStorage.getItem("daily-bread-admin-token"); if (!stored) { setHydrated(true); return; } setToken(stored); getAdminProfile(stored).then((current) => setProfile(current)).catch(() => { localStorage.removeItem("daily-bread-admin-token"); setToken(null); }).finally(() => setHydrated(true)); }, []);
  useEffect(() => { if (!token || !profile) return; setLoading(true); setError(null); Promise.all([getOverview(token), getMessages(token), getJourneys(token), getSettings(token)]).then(([overview, loadedMessages, loadedJourneys, loadedSettings]) => { setStats(overview.stats); setEmailsSentByDay(overview.emails_sent_by_day); setRefreshedAt(overview.refreshed_at); setRecentSubscribers(overview.subscribers); setMessages(loadedMessages); setJourneys(loadedJourneys); setSettings(loadedSettings); }).catch((err) => setError(err instanceof ApiRequestError ? err.message : "Could not load the admin workspace.")).finally(() => setLoading(false)); }, [token, profile, refreshNonce]);
  useEffect(() => { if (!token || !profile) return; const now = new Date(); const nextUtcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)); const timer = window.setTimeout(() => setRefreshNonce((current) => current + 1), Math.max(nextUtcDay.getTime() - now.getTime(), 1000)); return () => window.clearTimeout(timer); }, [token, profile, refreshNonce]);

  const navGroups = useMemo(() => [
    { label: "Workspace", items: [{ key: "dashboard" as View, label: "📊 Dashboard" }] },
    { label: "Today’s Word", items: [{ key: "today" as View, label: "✍️ Today’s Word management" }, { key: "ai" as View, label: "🤖 AI generation/review" }] },
    { label: "Journeys", items: [{ key: "journeys" as View, label: "🛤️ Journey management" }, { key: "ai-journeys" as View, label: "🤖 AI Journey generation/review" }] },
    { label: "Audience", items: [{ key: "subscribers" as View, label: "👥 Subscribers" }, { key: "announcements" as View, label: "📢 Announcements" }] },
    { label: "Configuration", items: [{ key: "settings" as View, label: "⚙️ Settings" }] },
  ], []);
  const currentLabel = navGroups.flatMap((group) => group.items).find((item) => item.key === view)?.label ?? "Dashboard";
  if (!hydrated) return <PageSkeleton />;
  if (!token || !profile) return <LoginCard onLogin={(session) => { setToken(session.access_token); setProfile({ id: session.access_token, full_name: session.full_name, email: session.email, is_active: true }); }} />;
  if (loading && !refreshedAt) return <PageSkeleton />;

  async function signOut() { try { await logoutAdmin(token!); } finally { localStorage.removeItem("daily-bread-admin-token"); setToken(null); setProfile(null); } }
  const addMessage = (message: DailyMessage) => setMessages((current) => [message, ...current.filter((item) => item.id !== message.id)]);
  const addJourney = (journey: Journey) => setJourneys((current) => [journey, ...current.filter((item) => item.id !== journey.id)]);

  return <div className="min-h-screen bg-[#edf3f1] p-3 text-brand-teal md:p-5"><DialogHost /><div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1600px] flex-col gap-3 lg:min-h-[calc(100vh-2.5rem)] lg:flex-row"><aside className="relative overflow-hidden rounded-[2.25rem] bg-brand-teal px-5 py-6 text-center text-white shadow-[0_20px_50px_rgba(11,55,59,0.16)] lg:sticky lg:top-5 lg:flex lg:min-h-[calc(100vh-2.5rem)] lg:w-[285px] lg:shrink-0 lg:flex-col lg:px-4"><div className="admin-slate-blob admin-shell-blob-one" aria-hidden="true" /><div className="admin-slate-blob admin-shell-blob-two" aria-hidden="true" /><div className="relative flex items-center justify-between lg:block"><div><img src="/dailybread-lockup.png" alt="Daily Bread" className="mx-auto h-auto w-40 object-contain object-center brightness-0 invert" /><p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Admin workspace</p></div><button type="button" onClick={() => void signOut()} className="admin-signout-button mx-auto rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold text-white/90 lg:mt-8">Sign out</button></div><nav className="relative mt-8 space-y-6 text-left lg:flex-1">{navGroups.map((group) => <div key={group.label}><p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{group.label}</p><div className="mt-2 space-y-1">{group.items.map((item) => <button key={item.key} onClick={() => { setView(item.key); setError(null); }} className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${view === item.key ? "bg-white/15 font-semibold text-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>{item.label}</button>)}</div></div>)}</nav><a href={LANDING_URL} className="relative mx-auto mt-8 hidden text-center text-sm text-white/50 underline underline-offset-4 lg:block">View public site</a></aside><main className="min-w-0 flex-1 rounded-[2.25rem] bg-white px-5 py-7 shadow-[0_20px_50px_rgba(11,55,59,0.06)] md:px-8 lg:px-12 lg:py-10"><header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-brand-teal/45">Good to see you, {profile.full_name.split(" ")[0]}.</p><h2 className="mt-1 text-3xl font-semibold tracking-tight">{currentLabel}</h2></div><div className="text-right"><p className="text-sm font-medium">{profile.email}</p><p className="text-xs text-brand-teal/45">Authenticated admin</p></div></header>{error && <div className="mb-6 rounded-xl border border-brand-rust/20 bg-brand-rust/5 p-4 text-sm text-brand-rust">{error}</div>}{loading && refreshedAt && <div className="mb-6 rounded-xl bg-white p-4 text-sm text-brand-teal/55 shadow-sm">Refreshing workspace…</div>}{view === "dashboard" && <div className="space-y-8"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-brand-teal/55">Dashboard analytics refresh automatically at UTC midnight.</p>{refreshedAt && <p className="text-xs text-brand-teal/45">Last refreshed {formatDate(refreshedAt)}</p>}</div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><Metric pulseKey={refreshNonce} label="Total users" value={stats.total_subscribers} detail={`${stats.active_subscribers} active`} /><Metric pulseKey={refreshNonce} label="Emails today" value={stats.emails_sent_today} detail="Successful sends" /><Metric pulseKey={refreshNonce} label="Journey enrollments" value={stats.total_journey_enrollments} detail={`${stats.active_journey_enrollments} active`} /><Metric pulseKey={refreshNonce} label="New this week" value={stats.new_this_week} detail="Recent signups" /><Metric pulseKey={refreshNonce} label="Messages" value={stats.total_messages} detail={`${stats.pending_messages} pending review`} /><Metric pulseKey={refreshNonce} label="Journeys" value={stats.total_journeys} detail={`${stats.published_journeys} published`} /></div><EmailDeliveryChart data={emailsSentByDay} /><div className="grid gap-6 xl:grid-cols-2"><div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h3 className="text-lg font-semibold">Latest Today’s Word messages</h3><div className="mt-4 space-y-3">{messages.slice(0, 5).map((message) => <div key={message.id} className="flex items-center justify-between gap-3 border-b border-black/5 pb-3 last:border-0"><div><p className="font-medium">{message.title}</p><p className="text-xs text-brand-teal/45">{formatDate(message.message_date)}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] ${statusClass(message.status)}`}>{message.status.replace("_", " ")}</span></div>)}</div></div><div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"><h3 className="text-lg font-semibold">Recent subscribers</h3><div className="mt-4 space-y-3">{recentSubscribers.slice(0, 5).map((subscriber) => <div key={subscriber.id} className="flex items-center justify-between gap-3 border-b border-black/5 pb-3 last:border-0"><div><p className="font-medium">{subscriber.full_name}</p><p className="text-xs text-brand-teal/45">{subscriber.email}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] ${statusClass(subscriber.status || "active")}`}>{subscriber.status || "active"}</span></div>)}</div></div></div></div>}{view === "today" && <div className="space-y-6"><MessageForm token={token} onCreated={addMessage} /><MessageLibrary token={token} messages={messages} setMessages={setMessages} /></div>}{view === "ai" && <div className="space-y-6"><AiMessageGenerator token={token} onCreated={addMessage} /><MessageLibrary token={token} messages={messages} setMessages={setMessages} aiOnly /></div>}{view === "journeys" && <div className="space-y-6"><JourneyForm token={token} onCreated={addJourney} /><JourneyLibrary token={token} journeys={journeys} setJourneys={setJourneys} /></div>}{view === "ai-journeys" && <div className="space-y-6"><AiJourneyGenerator token={token} onCreated={addJourney} /><JourneyLibrary token={token} journeys={journeys} setJourneys={setJourneys} draftOnly /></div>}{view === "subscribers" && <SubscribersSection token={token} />}{view === "announcements" && <AnnouncementSection token={token} />}{view === "settings" && <SettingsSection token={token} settings={settings} setSettings={setSettings} />}</main></div></div>;
}
