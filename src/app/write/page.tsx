import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Connection, User } from "@/models";
import LetterComposer from "@/components/letter-composer";
import { clerkConfigured } from "@/lib/config";
export const dynamic = "force-dynamic";
export default async function WritePage({ searchParams }: { searchParams: Promise<{ replyTo?: string }> }) {
  if (!clerkConfigured) redirect("/sign-in");
  const { userId } = await auth(); if (!userId) redirect("/sign-in");
  const { replyTo } = await searchParams;
  await connectDB();
  const connections = await Connection.find({ participants: userId, status: "accepted" }).lean();
  const ids = connections.map(c => c.participants.find((id: string) => id !== userId)).filter(Boolean);
  const people = await User.find({ clerkId: { $in: ids } }).select("clerkId displayName username").lean();
  return <main className="write-page"><header><Link className="brand" href="/mailbox"><span className="brand-mark">✉</span> dear, <i>letter</i></Link><Link className="text-link" href="/mailbox">← Back to mailbox</Link></header><LetterComposer people={people.map(p=>({id:p.clerkId,name:p.displayName,username:p.username}))} initialRecipientId={replyTo}/></main>;
}
