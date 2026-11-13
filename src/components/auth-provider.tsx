"use client";
import { ClerkProvider } from "@clerk/nextjs";

export default function AuthProvider({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  if (!enabled) return children;
  return <ClerkProvider>{children}</ClerkProvider>;
}
