"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mail, Menu, X } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";

export default function SiteHeader({ unreadCount = 0 }: { unreadCount?: number }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
      if (event.key !== "Tab" || !menuRef.current) return;
      const focusable = [...menuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const mailboxLink = (className: string) => <Link className={className} href="/mailbox" onClick={() => setOpen(false)}>
    <Mail size={19} aria-hidden="true" /> <span>Your mailbox</span>
    {unreadCount > 0 && <span className="mailbox-unread" aria-label={`${unreadCount} unread letters`}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
  </Link>;
  const logo = <Link className="brand" href="/" onClick={() => setOpen(false)}><span className="brand-mark"><Mail size={17} /></span> dear, <i>letter</i></Link>;
  const signInLink = <Link className="login-link" href="/sign-in" onClick={() => setOpen(false)}>Sign in</Link>;
  const writeLink = <Link className="button button-small" href="/write" onClick={() => setOpen(false)}>Write a letter <span aria-hidden="true">→</span></Link>;
  const firstLetterLink = <Link className="button button-small" href="/sign-up" onClick={() => setOpen(false)}>Write your first letter <span aria-hidden="true">→</span></Link>;
  const accountButton = <span className="account-control" title="Account and sign out"><UserButton /></span>;

  return <header className="site-header">
    {logo}
    <nav className="site-desktop-nav" aria-label="Main navigation">
      <Link href="/">Home</Link><Link href="/#how-it-works">How it works</Link><Link href="/#our-little-idea">Our little idea</Link>
    </nav>
    <div className="site-desktop-actions">
      {!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <>{signInLink}{firstLetterLink}</> : <>
        <Show when="signed-out">{signInLink}{firstLetterLink}</Show>
        <Show when="signed-in">{mailboxLink("mailbox-primary")}{accountButton}</Show>
      </>}
    </div>
    <button ref={triggerRef} className="menu-trigger" type="button" aria-label={open ? "Close site menu" : "Open site menu"} aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(value => !value)}>
      {open ? <X size={25} /> : <Menu size={25} />}
    </button>
    {open && <div className="menu-scrim" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} />}
    <div ref={menuRef} id="site-menu" className={`site-mobile-drawer${open ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden={!open} inert={!open}>
      <div className="drawer-heading">{logo}<button type="button" aria-label="Close site menu" onClick={() => { setOpen(false); triggerRef.current?.focus(); }}><X size={24} /></button></div>
      <nav className="drawer-links" aria-label="Mobile navigation">
        <Link href="/" onClick={() => setOpen(false)}>Home</Link>
        <Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link>
        <Link href="/#our-little-idea" onClick={() => setOpen(false)}>Our little idea</Link>
        {!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <>
          <Link className="drawer-mailbox" href="/mailbox" onClick={() => setOpen(false)}><Mail size={20} /> Your mailbox</Link>
          {firstLetterLink}
          {signInLink}
        </> : <>
          <Show when="signed-in">{mailboxLink("drawer-mailbox")}{writeLink}{accountButton}</Show>
          <Show when="signed-out"><Link className="drawer-mailbox" href="/mailbox" onClick={() => setOpen(false)}><Mail size={20} /> Your mailbox</Link><Link href="/sign-up" onClick={() => setOpen(false)}>Write your first letter</Link>{signInLink}</Show>
        </>}
      </nav>
      <p className="drawer-note">A letter takes its time. So can you.</p>
    </div>
  </header>;
}
