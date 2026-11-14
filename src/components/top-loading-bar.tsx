"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FINISH_EVENT, START_EVENT } from "@/lib/top-loading";

type Phase = "idle" | "loading" | "complete";

export default function TopLoadingBar() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    let safetyTimer: number | undefined;
    let finishTimer: number | undefined;
    const start = () => {
      window.clearTimeout(finishTimer);
      window.clearTimeout(safetyTimer);
      setPhase("loading");
      safetyTimer = window.setTimeout(() => setPhase("idle"), 15000);
    };
    const finish = () => {
      window.clearTimeout(safetyTimer);
      setPhase("complete");
      finishTimer = window.setTimeout(() => setPhase("idle"), 250);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const next = new URL(link.href, window.location.href);
      if (next.origin !== window.location.origin) return;
      if (next.pathname !== window.location.pathname || next.search !== window.location.search) start();
    };
    window.addEventListener(START_EVENT, start);
    window.addEventListener(FINISH_EVENT, finish);
    document.addEventListener("click", onClick, true);
    return () => {
      window.clearTimeout(safetyTimer);
      window.clearTimeout(finishTimer);
      window.removeEventListener(START_EVENT, start);
      window.removeEventListener(FINISH_EVENT, finish);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new Event(FINISH_EVENT));
  }, [pathname]);

  return <div className={`top-loading-bar ${phase}`} aria-hidden="true"><span /></div>;
}
