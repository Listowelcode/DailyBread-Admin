import { useState } from "react";
import type { Subscriber } from "@/lib/types";

type SubscriberDetailOverlayProps = {
  subscriber: Subscriber;
  onClose: () => void;
  onDelete: () => Promise<void>;
};

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function Preference({ label, enabled, detail }: { label: string; enabled: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-[#fbfaf7] px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-brand-teal">{label}</p>
        <p className="mt-1 text-xs text-brand-teal/50">{detail}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
        {enabled ? "On" : "Off"}
      </span>
    </div>
  );
}

export default function SubscriberDetailOverlay({ subscriber, onClose, onDelete }: SubscriberDetailOverlayProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Subscriber could not be deleted.");
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
    <div className="admin-overlay-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-brand-teal/45 p-4 backdrop-blur-md" onClick={onClose} role="presentation">
      <section className="subscriber-detail-panel admin-overlay-panel max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="subscriber-detail-title">
        <div className="relative overflow-hidden bg-brand-teal px-6 py-7 text-white md:px-9 md:py-8">
          <div className="absolute -right-14 -top-20 h-52 w-52 rounded-full border border-white/10 bg-white/5" aria-hidden="true" />
          <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full border border-brand-rust/30 bg-brand-rust/15" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-2xl font-bold text-white ring-1 ring-white/20">
                {subscriber.full_name.trim().slice(0, 1).toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Subscriber profile</p>
                <h2 id="subscriber-detail-title" className="mt-1 truncate text-2xl font-bold tracking-tight md:text-3xl">{subscriber.full_name}</h2>
                <p className="mt-1 truncate text-sm text-white/70">{subscriber.email}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} disabled={deleting} className="admin-action-button shrink-0 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Close subscriber details">Close</button>
          </div>
        </div>

        <div className="space-y-7 p-6 md:p-9">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/5 bg-[#fbfaf7] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-teal/45">Status</p><span className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">{subscriber.status || "active"}</span></div>
            <div className="rounded-2xl border border-black/5 bg-[#fbfaf7] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-teal/45">Timezone</p><p className="mt-3 text-sm font-semibold text-brand-teal">{subscriber.timezone || "Not set"}</p></div>
            <div className="rounded-2xl border border-black/5 bg-[#fbfaf7] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-teal/45">Subscriber ID</p><p className="mt-3 truncate font-mono text-xs text-brand-teal/65" title={subscriber.id}>{subscriber.id}</p></div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-rust">Delivery preferences</p><h3 className="mt-1 text-xl font-bold text-brand-teal">Their Daily Bread rhythm</h3></div><span className="rounded-full bg-brand-rust/10 px-3 py-1 text-xs font-semibold text-brand-rust">Personalized</span></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Preference label="Today’s Word" enabled={subscriber.todays_word_enabled} detail={subscriber.todays_word_enabled ? `Delivery time ${subscriber.todays_word_time || "not set"}` : "Daily message delivery is paused"} />
              <Preference label="Spiritual Journeys" enabled={subscriber.spiritual_journey_enabled} detail={subscriber.spiritual_journey_enabled ? `Delivery time ${subscriber.spiritual_journey_time || "not set"}` : "Journey delivery is paused"} />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-rust">Account timeline</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/5 p-4"><p className="text-xs text-brand-teal/45">Joined</p><p className="mt-2 text-sm font-semibold text-brand-teal">{formatDate(subscriber.created_at)}</p></div>
              <div className="rounded-2xl border border-black/5 p-4"><p className="text-xs text-brand-teal/45">Last active</p><p className="mt-2 text-sm font-semibold text-brand-teal">{formatDate(subscriber.last_active_at)}</p></div>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-rust">Journey enrollment</p><h3 className="mt-1 text-xl font-bold text-brand-teal">Their active path</h3></div><span className="text-sm text-brand-teal/50">{subscriber.journey_enrollments?.length || 0} enrolled</span></div>
            {subscriber.journey_enrollments?.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{subscriber.journey_enrollments.map((enrollment) => <div key={enrollment.id} className="rounded-2xl border border-brand-teal/10 bg-brand-teal/5 p-5"><div className="flex items-start justify-between gap-3"><h4 className="font-bold text-brand-teal">{enrollment.journey_title}</h4><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold capitalize text-brand-teal">{enrollment.status}</span></div><p className="mt-3 text-sm text-brand-teal/65">Currently on day {enrollment.current_day}.</p><div className="mt-4 grid grid-cols-2 gap-3 text-xs text-brand-teal/55"><p>Started<br /><strong className="font-semibold text-brand-teal">{formatDate(enrollment.started_at)}</strong></p><p>Last activity<br /><strong className="font-semibold text-brand-teal">{formatDate(enrollment.last_activity_at)}</strong></p></div></div>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-black/10 px-5 py-8 text-center text-sm text-brand-teal/50">This subscriber has not enrolled in a journey yet.</div>}
          </div>

          <div className="rounded-2xl border border-brand-rust/20 bg-brand-rust/[0.04] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-rust">Profile options</p>
                <h3 className="mt-1 text-lg font-bold text-brand-teal">Remove this subscriber</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-brand-teal/60">Permanently deletes the profile and its associated preferences, journey enrollments, delivery history, and magic-link tokens.</p>
              </div>
              <button type="button" onClick={() => setConfirmOpen(true)} disabled={deleting} className="admin-danger-button rounded-xl border border-brand-rust/30 bg-brand-rust px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#7b241e] disabled:cursor-not-allowed disabled:opacity-60">Delete subscriber</button>
            </div>
            {deleteError && <p className="mt-3 text-sm font-semibold text-brand-rust">{deleteError}</p>}
          </div>
        </div>
      </section>
    </div>
    {confirmOpen && <div className="admin-confirm-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-brand-teal/45 p-5 backdrop-blur-lg" role="presentation"><section className="admin-confirm-panel w-full max-w-md rounded-[2rem] border border-white/60 bg-white p-7 shadow-[0_24px_80px_rgba(11,55,59,0.28)]" role="alertdialog" aria-modal="true" aria-labelledby="delete-subscriber-title" aria-describedby="delete-subscriber-description"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-rust/10 text-xl text-brand-rust" aria-hidden="true">!</div><p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-brand-rust">Profile option</p><h3 id="delete-subscriber-title" className="mt-2 text-2xl font-bold tracking-tight text-brand-teal">Delete subscriber?</h3><p id="delete-subscriber-description" className="mt-3 text-sm leading-6 text-brand-teal/65">You are about to permanently remove <strong className="text-brand-teal">{subscriber.full_name || subscriber.email}</strong> and the profile’s associated preferences, journey enrollments, delivery history, and tokens.</p><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setConfirmOpen(false)} disabled={deleting} className="admin-action-button rounded-xl border border-black/10 px-4 py-3 text-sm font-bold text-brand-teal hover:bg-brand-teal/5 disabled:cursor-not-allowed disabled:opacity-50">Keep subscriber</button><button type="button" onClick={() => void confirmDelete()} disabled={deleting} className="admin-danger-button rounded-xl bg-brand-rust px-4 py-3 text-sm font-bold text-white hover:bg-[#7b241e] disabled:cursor-not-allowed disabled:opacity-60">{deleting ? "Deleting…" : "Yes, delete permanently"}</button></div></section></div>}
  </>
  );
}
