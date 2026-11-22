"use client";

import { useEffect, useRef, useState } from "react";

const SIZE_KEY = "dear-letter-reading-size";
export default function LetterReading({ greeting, body, signature, senderName, font, ink }: { greeting: string; body: string; signature: string; senderName: string; font: string; ink: string }) {
  const [size, setSize] = useState(22);
  const storedSize = useRef(22);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const saved = Number(localStorage.getItem(SIZE_KEY));
    if (saved >= 20 && saved <= 30) {
      storedSize.current = saved;
      bodyRef.current?.style.setProperty("--letter-font-size", `${saved / 16}rem`);
    }
  }, []);
  function adjust(amount: number) {
    const next = Math.min(30, Math.max(20, storedSize.current + amount));
    storedSize.current = next;
    localStorage.setItem(SIZE_KEY, String(next));
    bodyRef.current?.style.setProperty("--letter-font-size", `${next / 16}rem`);
    setSize(next);
  }
  return <>
    <div className="reading-size" aria-label="Letter text size controls"><span>Letter size</span><button type="button" onClick={() => adjust(-2)} disabled={size <= 20} aria-label="Decrease letter text size">A−</button><button type="button" onClick={() => adjust(2)} disabled={size >= 30} aria-label="Increase letter text size">A+</button></div>
    <div ref={bodyRef} className={`letter-body ink-${ink} ${font}-font`} style={{ "--letter-font-size": `${size / 16}rem` } as React.CSSProperties}><p className="letter-greeting">{greeting || "Dear friend,"}</p><div className="letter-copy">{body.split(/\r?\n/).map((line, i) => <p key={i}>{line || <br />}</p>)}</div><p className="letter-signoff">{signature || "With love,"}<br />{senderName}</p></div>
  </>;
}
