"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deliverAllScheduledLettersNowAction, processDueLettersNow, saveGlobalDeliverySettings } from "@/actions/admin";
import type { DeliverySettings } from "@/lib/domain";
import { finishTopLoading, startTopLoading } from "@/lib/top-loading";
import { showToast } from "@/lib/toast";

type AdminStats = { users: number; scheduled: number; overdue: number; delivered: number; pendingConnections: number };

export default function AdminPanel({ settings, stats }: { settings: DeliverySettings; stats: AdminStats }) {
  const router = useRouter();
  const [mode, setMode] = useState(settings.mode);
  const [minDays, setMinDays] = useState(settings.minDays);
  const [maxDays, setMaxDays] = useState(settings.maxDays);
  const [busy, setBusy] = useState(false);
  const [confirmingAll, setConfirmingAll] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    startTopLoading();
    try {
      const result = await saveGlobalDeliverySettings({ mode, minDays, maxDays });
      showToast(result.ok ? "Delivery timing saved for new letters." : result.error || "Could not save settings.", result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    } catch {
      showToast("Could not save settings. Please try again.", "error");
    } finally {
      setBusy(false);
      finishTopLoading();
    }
  }

  async function processDue() {
    setBusy(true);
    startTopLoading();
    try {
      const result = await processDueLettersNow();
      showToast(result.ok ? `Processed ${result.delivered} due ${result.delivered === 1 ? "letter" : "letters"}.` : result.error || "Could not process deliveries.", result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    } catch {
      showToast("Could not process deliveries. Please try again.", "error");
    } finally {
      setBusy(false);
      finishTopLoading();
    }
  }

  async function deliverAll() {
    setBusy(true);
    setConfirmingAll(false);
    startTopLoading();
    try {
      const result = await deliverAllScheduledLettersNowAction();
      showToast(result.ok ? `Delivered ${result.delivered} ${result.delivered === 1 ? "letter" : "letters"} immediately.` : result.error || "Could not deliver the remaining letters.", result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    } catch {
      showToast("Could not deliver the remaining letters. Please try again.", "error");
    } finally {
      setBusy(false);
      finishTopLoading();
    }
  }

  return <div className="admin-panel">
    <section className="admin-stats" aria-label="Application overview">
      <div><span>MEMBERS</span><b>{stats.users}</b></div>
      <div><span>IN TRANSIT</span><b>{stats.scheduled}</b></div>
      <div><span>PAST DUE</span><b>{stats.overdue}</b></div>
      <div><span>DELIVERED</span><b>{stats.delivered}</b></div>
      <div><span>CONNECTION REQUESTS</span><b>{stats.pendingConnections}</b></div>
    </section>

    <form className="admin-card" onSubmit={save}>
      <div className="section-kicker">GLOBAL DELIVERY TIMING</div>
      <h2>Choose how long letters travel.</h2>
      <p>These settings apply to letters sent after you save. Letters already in transit keep their original arrival time.</p>
      <label className="admin-mode"><span><b>Delivery mode</b><small>Instant delivery opens the letter as soon as it is sent.</small></span>
        <select value={mode} onChange={event => setMode(event.target.value as DeliverySettings["mode"])}>
          <option value="random">Random delay</option>
          <option value="instant">Instant</option>
        </select>
      </label>
      {mode === "random" && <div className="admin-range">
        <label>Shortest delay (days)<input type="number" min={0} max={30} step={1} value={minDays} onChange={event => setMinDays(Number(event.target.value))} required /></label>
        <label>Longest delay (days)<input type="number" min={0} max={30} step={1} value={maxDays} onChange={event => setMaxDays(Number(event.target.value))} required /></label>
      </div>}
      {minDays > maxDays && <p className="admin-error" role="alert">The shortest delay must not exceed the longest delay.</p>}
      <div className="admin-actions"><button className="button" disabled={busy || (mode === "random" && minDays > maxDays)}>{busy ? "Saving…" : "Save delivery timing"}</button></div>
    </form>

    <section className="admin-card admin-operations">
      <div className="section-kicker">DELIVERY OPERATIONS</div>
      <h2>Process letters that are due.</h2>
      <p>The scheduled job normally handles these automatically. You can run the same delivery process now.</p>
      <button className="quiet-button" type="button" disabled={busy} onClick={processDue}>{busy ? "Working…" : "Process due letters now →"}</button>
      <div className="admin-deliver-all">
        <h3>Bring every remaining letter to its recipient.</h3>
        <p>This immediately delivers every letter still scheduled, even if its arrival date is days away.</p>
        <button
          className={confirmingAll ? "quiet-button" : "admin-deliver-all-trigger"}
          type="button"
          disabled={busy || (!confirmingAll && stats.scheduled === 0)}
          aria-expanded={confirmingAll}
          aria-controls="admin-delivery-confirmation"
          onClick={() => setConfirmingAll(value => !value)}
        >
          {confirmingAll ? "Cancel immediate delivery" : stats.scheduled === 0 ? "No scheduled letters" : `Deliver all ${stats.scheduled} scheduled ${stats.scheduled === 1 ? "letter" : "letters"} now`}
        </button>
        {confirmingAll && <div id="admin-delivery-confirmation" className="admin-delivery-confirm" role="group" aria-label="Confirm immediate delivery of all scheduled letters">
          <p>This cannot be undone. Recipients will see their letters in their mailbox right away.</p>
          <button className="admin-deliver-all-trigger" type="button" disabled={busy} onClick={deliverAll}>Yes, deliver all now</button>
        </div>}
      </div>
    </section>
  </div>;
}
