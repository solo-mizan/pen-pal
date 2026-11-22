"use client";

import { useRef, useState } from "react";
import { MailOpen } from "lucide-react";

export default function LetterOpening({ children }: { children: React.ReactNode }) {
  const [opened, setOpened] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  return <div className={`letter-opening${opened ? " is-opened" : ""}`}>
    <div className="opening-envelope" aria-hidden="true"><div className="opening-paper"><span>YOUR LETTER</span><i /><i /><i /></div><div className="opening-back" /><div className="opening-flap" /><span className="opening-seal">d</span></div>
    <div ref={contentRef} className="opening-content" id="delivered-letter" tabIndex={-1} aria-hidden={!opened} inert={!opened}>{children}</div>
    {!opened && <div className="opening-invitation"><p>A letter, written just for you.</p><button type="button" className="button" aria-expanded={opened} aria-controls="delivered-letter" onClick={() => { setOpened(true); window.setTimeout(() => contentRef.current?.focus(), 0); }}><MailOpen size={18} /> Open your letter</button></div>}
  </div>;
}
