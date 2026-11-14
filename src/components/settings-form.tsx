"use client";

import { useState } from "react";
import { updatePreferences } from "@/actions/mail";
import { finishTopLoading, startTopLoading } from "@/lib/top-loading";
import { showToast } from "@/lib/toast";

type FormState = {
  displayName: string;
  username: string;
  preferredLanguage: "en" | "bn";
  timezone: string;
  profileVisible: boolean;
  emailLetters: boolean;
  emailConnections: boolean;
  writingReminders: boolean;
};

export default function SettingsForm({ initial }: { initial: FormState }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  function text(field: "displayName" | "username" | "timezone", value: string) {
    setForm(previous => ({ ...previous, [field]: value }));
  }

  function check(field: "profileVisible" | "emailLetters" | "emailConnections" | "writingReminders", value: boolean) {
    setForm(previous => ({ ...previous, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    startTopLoading();
    try {
      const result = await updatePreferences(form);
      showToast(result.ok ? "Your mailbox settings are tucked away safely." : result.error || "Could not save settings.", result.ok ? "success" : "error");
    } catch {
      showToast("Could not save settings. Please try again.", "error");
    } finally {
      setSaving(false);
      finishTopLoading();
    }
  }

  return <form className="settings-form" onSubmit={submit}>
    <div className="settings-group">
      <span className="section-kicker">YOUR NAME IN THE MAIL</span>
      <label>Display name<input value={form.displayName} maxLength={60} required onChange={event => text("displayName", event.target.value)} /></label>
      <label>Username<div className="username-input"><span>@</span><input value={form.username} minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" required onChange={event => text("username", event.target.value)} /></div></label>
      <label>Preferred language<select value={form.preferredLanguage} onChange={event => setForm(previous => ({ ...previous, preferredLanguage: event.target.value as "en" | "bn" }))}><option value="en">English</option><option value="bn">বাংলা</option></select></label>
      <label>Your timezone<input value={form.timezone} placeholder="Asia/Dhaka" onChange={event => text("timezone", event.target.value)} /><small className="timezone-note">Asia/Dhaka is the recommended timezone for Bangladesh.</small></label>
    </div>
    <div className="settings-group">
      <span className="section-kicker">A LITTLE PRIVACY</span>
      <label className="toggle-row"><span><b>Discoverable by username</b><small>People can find you when they know your username.</small></span><input type="checkbox" checked={form.profileVisible} onChange={event => check("profileVisible", event.target.checked)} /></label>
    </div>
    <div className="settings-group">
      <span className="section-kicker">NOTES FROM YOUR MAILBOX</span>
      <label className="toggle-row"><span><b>Letter arrival emails</b><small>A note when a letter reaches your mailbox.</small></span><input type="checkbox" checked={form.emailLetters} onChange={event => check("emailLetters", event.target.checked)} /></label>
      <label className="toggle-row"><span><b>Connection request emails</b><small>A heads up when someone asks to connect.</small></span><input type="checkbox" checked={form.emailConnections} onChange={event => check("emailConnections", event.target.checked)} /></label>
      <label className="toggle-row"><span><b>Writing reminders</b><small>Occasional gentle reminders to write someone dear.</small></span><input type="checkbox" checked={form.writingReminders} onChange={event => check("writingReminders", event.target.checked)} /></label>
    </div>
    <div className="settings-save"><button className="button" disabled={saving}>{saving ? "Saving…" : "Save your settings"}</button></div>
  </form>;
}
