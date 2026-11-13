"use client";
import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

function VisitorLinks() {
  return <><Link className="login-link" href="/sign-in">Log in</Link><Link className="button button-small" href="/sign-up">Write your first letter <span aria-hidden="true">→</span></Link></>;
}

export default function AuthControls() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <VisitorLinks />;
  return <>
    <Show when="signed-out"><VisitorLinks /></Show>
    <Show when="signed-in"><div className="signed-in-nav"><Link className="login-link" href="/mailbox">Your mailbox</Link><UserButton /></div></Show>
  </>;
}
