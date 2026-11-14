"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { TOAST_EVENT, type ToastKind } from "@/lib/toast";

type Toast = { id: number; message: string; kind: ToastKind };
let nextId = 0;

export default function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const remove = (id: number) => setToasts(current => current.filter(toast => toast.id !== id));
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string; kind?: ToastKind }>).detail;
      if (!detail?.message) return;
      const toast: Toast = { id: ++nextId, message: detail.message, kind: detail.kind || "success" };
      setToasts(current => [...current.slice(-2), toast]);
      window.setTimeout(() => remove(toast.id), 4200);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    if (regionRef.current) regionRef.current.dataset.ready = "true";
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return <div ref={regionRef} className="toast-region" data-ready="false" aria-label="Notifications" aria-live="polite" aria-relevant="additions text">
    {toasts.map(toast => {
      const Icon = toast.kind === "success" ? Check : toast.kind === "error" ? CircleAlert : Info;
      return <div className={`toast toast-${toast.kind}`} key={toast.id} role={toast.kind === "error" ? "alert" : "status"}>
        <span className="toast-icon"><Icon size={17} strokeWidth={1.8} /></span>
        <p>{toast.message}</p>
        <button type="button" aria-label="Dismiss notification" onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))}><X size={15} /></button>
      </div>;
    })}
  </div>;
}
