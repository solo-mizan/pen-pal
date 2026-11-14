"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";
import type { ReactNode } from "react";

export default function HomeMailboxCta({ className, children }: { className: string; children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <Link href="/sign-up" className={className}>{children}</Link>;
  }

  return <>
    <Show when="signed-out"><Link href="/sign-up" className={className}>{children}</Link></Show>
    <Show when="signed-in"><Link href="/mailbox" className={className}>{children}</Link></Show>
  </>;
}
