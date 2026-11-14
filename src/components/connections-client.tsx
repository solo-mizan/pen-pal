"use client";

import { useState } from "react";
import { removeConnection, respondToConnection, sendConnectionRequest } from "@/actions/mail";
import { finishTopLoading, startTopLoading } from "@/lib/top-loading";
import { showToast } from "@/lib/toast";

type Item = { id: string; person: { id: string; name: string; username: string } };

export default function ConnectionsClient({ connections, incoming }: { connections: Item[]; incoming: Item[] }) {
  const [busy, setBusy] = useState("");

  async function add(form: FormData) {
    const username = String(form.get("username") || "");
    setBusy("add");
    startTopLoading();
    try {
      const result = await sendConnectionRequest({ username });
      showToast(result.ok ? `A little hello is on its way to @${username}.` : result.error || "Could not send request.", result.ok ? "success" : "error");
    } catch {
      showToast("Could not send request. Please try again.", "error");
    } finally {
      setBusy("");
      finishTopLoading();
    }
  }

  async function respond(id: string, accept: boolean) {
    setBusy(id);
    startTopLoading();
    try {
      const result = await respondToConnection(id, accept);
      showToast(result.ok ? (accept ? "You’re connected. A letter can find its way between you now." : "Request declined.") : result.error || "Could not update request.", result.ok ? (accept ? "success" : "info") : "error");
    } catch {
      showToast("Could not update request. Please try again.", "error");
    } finally {
      setBusy("");
      finishTopLoading();
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this connection? You can’t send new letters after disconnecting.")) return;
    setBusy(id);
    startTopLoading();
    try {
      const result = await removeConnection(id);
      showToast(result.ok ? "Connection removed." : result.error || "Could not remove connection.", result.ok ? "info" : "error");
    } catch {
      showToast("Could not remove connection. Please try again.", "error");
    } finally {
      setBusy("");
      finishTopLoading();
    }
  }

  return <section className="connections-content"><div className="eyebrow"><span /> MAKE ROOM FOR GOOD LETTERS</div><h1>Your people.</h1><p>Letters go only between people who’ve said yes to each other.</p>
    <form className="connect-form" action={add}><label htmlFor="username">Find someone by username</label><div><span>@</span><input id="username" name="username" placeholder="their_username" required /><button className="button" disabled={busy === "add"}>{busy === "add" ? "Sending…" : "Send a hello →"}</button></div><small>They’ll get a connection request. Your letters stay private between you.</small></form>
    <div className="connections-columns">
      <div><div className="mail-section-heading"><div><span className="section-kicker">A LITTLE HELLO</span><h2>Requests waiting</h2></div><span className="count-pill">{incoming.length}</span></div>{incoming.length ? incoming.map(item => <div className="person-row" key={item.id}><div className="tiny-profile">{item.person.name[0]}</div><div><b>{item.person.name}</b><small>@{item.person.username} would like to connect</small></div><button disabled={busy === item.id} onClick={() => respond(item.id, true)}>Accept</button><button className="quiet-button" disabled={busy === item.id} onClick={() => respond(item.id, false)}>Decline</button></div>) : <p className="quiet-empty">No new requests. Your mailbox is peaceful.</p>}</div>
      <div><div className="mail-section-heading"><div><span className="section-kicker">YOUR CORRESPONDENTS</span><h2>Connected people</h2></div><span className="count-pill">{connections.length}</span></div>{connections.length ? connections.map(item => <div className="person-row" key={item.id}><div className="tiny-profile">{item.person.name[0]}</div><div><b>{item.person.name}</b><small>@{item.person.username}</small></div><a href="/write">Write <span>↗</span></a><button className="quiet-button" disabled={busy === item.id} onClick={() => remove(item.id)}>Remove</button></div>) : <p className="quiet-empty">The loveliest letters begin with a connection.</p>}</div>
    </div>
  </section>;
}
