"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Share, X } from "lucide-react";

type PushState = "checking" | "ready" | "enabled" | "denied" | "unsupported" | "not-configured" | "add-to-home" | "linked-elsewhere" | "error";
const OWNER_KEY = "dear-letter-push-user";

function decodeApplicationKey(value: string) {
  const padded = `${value}${"=".repeat((4 - value.length % 4) % 4)}`;
  const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(decoded, character => character.charCodeAt(0));
}

function pushSupported() {
  return window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function isIosDevice() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isHomeScreenApp() {
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

export default function PushControl({ userId, placement = "mailbox" }: { userId: string; placement?: "mailbox" | "settings" }) {
  const [state, setState] = useState<PushState>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const inspect = async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (!pushSupported()) { setState("unsupported"); return; }
      if (isIosDevice() && !isHomeScreenApp()) { setState("add-to-home"); return; }
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) { setState("not-configured"); return; }
      if (Notification.permission === "denied") { setState("denied"); return; }
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (cancelled) return;
      if (!subscription) { setState("ready"); return; }
      const owner = localStorage.getItem(OWNER_KEY);
      setState(owner === userId ? "enabled" : owner ? "linked-elsewhere" : "ready");
    };
    void inspect().catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [userId]);

  async function enable() {
    setBusy(true); setMessage("");
    let linkedElsewhere = false;
    try {
      // Call this directly from the button gesture; never prompt on page load.
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "denied" : "ready"); return; }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("Browser notifications are not configured yet.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeApplicationKey(key) });
      const response = await fetch("/api/push/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) { linkedElsewhere = true; setState("linked-elsewhere"); }
        throw new Error(result.error || "Could not enable notifications on this device.");
      }
      localStorage.setItem(OWNER_KEY, userId);
      setState("enabled");
      setMessage("This device will let you know when a letter arrives.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enable notifications on this device.");
      if (!linkedElsewhere) setState("error");
    } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/push/subscriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        if (!response.ok) throw new Error("Could not turn notifications off. Please try again.");
        await subscription.unsubscribe();
      }
      localStorage.removeItem(OWNER_KEY);
      setState("ready");
      setMessage("Notifications are off on this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not turn notifications off.");
    } finally { setBusy(false); }
  }

  const settings = placement === "settings";
  return <section className={`push-card${settings ? " push-card-settings" : ""}`} aria-labelledby={`push-title-${placement}`}>
    <div className="push-card-icon" aria-hidden="true"><Bell size={21} /></div>
    <div className="push-card-copy">
      <h2 id={`push-title-${placement}`}>{state === "enabled" ? "A gentle tap is ready" : "Get a gentle tap when a letter arrives"}</h2>
      {state === "checking" && <p>Checking this device…</p>}
      {state === "ready" && <p>Only when a letter reaches your mailbox. No notes when it’s sent or opened.</p>}
      {state === "enabled" && <p>This device will tell you when a letter has arrived. You can turn it off here any time.</p>}
      {state === "denied" && <p>Notifications are blocked in your browser. Change this site’s notification permission in your browser settings to turn them on.</p>}
      {state === "unsupported" && <p>This browser cannot receive push notifications. You can still find every letter in your mailbox.</p>}
      {state === "not-configured" && <p>Browser notifications are not configured yet. You can still find every letter in your mailbox.</p>}
      {state === "add-to-home" && <p className="ios-install-hint"><Share size={17} aria-hidden="true" /> On iPhone or iPad, tap Share, then “Add to Home Screen.” Open the app from its new icon to enable notifications.</p>}
      {state === "linked-elsewhere" && <p>This device is linked to another mailbox. Turn notifications off there before linking it here.</p>}
      {state === "error" && message && <p role="alert">{message}</p>}
      {message && state !== "error" && <p className="push-status" role="status">{message}</p>}
    </div>
    {(state === "ready" || state === "enabled") && <button type="button" role="switch" aria-checked={state === "enabled"} aria-label="Letter arrival notifications on this device" className={`push-action${state === "enabled" ? " push-action-quiet" : ""}`} disabled={busy} onClick={state === "enabled" ? disable : enable}>{state === "enabled" ? <BellOff size={17} /> : <Bell size={17} />} {busy ? (state === "enabled" ? "Turning off…" : "One moment…") : state === "enabled" ? "Turn off" : "Enable"}</button>}
    {state === "error" && <button type="button" className="push-action" disabled={busy} onClick={enable}>Try again</button>}
    {state === "linked-elsewhere" && <span className="push-device-note"><X size={15} /> Another mailbox</span>}
  </section>;
}
