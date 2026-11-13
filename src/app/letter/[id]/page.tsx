import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { deliverDueLetters } from "@/lib/delivery";
import { Letter, User } from "@/models";
import LetterPhotos from "@/components/letter-photos";
import LetterResponseTools from "@/components/letter-response-tools";
import LetterReading from "@/components/letter-reading";
import { clerkConfigured } from "@/lib/config";
import { formatLocalDate } from "@/lib/dates";

export const dynamic = "force-dynamic";
export default async function ReadLetter({ params }: { params: Promise<{ id: string }> }) {
  if (!clerkConfigured) redirect("/sign-in");
  const { userId } = await auth(); if (!userId) redirect("/sign-in");
  await connectDB(); await deliverDueLetters();
  const { id } = await params;
  const letter = await Letter.findOne({ _id: id, recipientId: userId, status: "delivered" }).lean();
  if (!letter) notFound();
  if (!letter.openedAt) await Letter.updateOne({ _id: letter._id, recipientId: userId, status: "delivered", openedAt: { $exists: false } }, { $set: { openedAt: new Date() } });
  const reader = await User.findOne({ clerkId: userId }).select("timezone").lean();
  const sender = await User.findOne({ clerkId: letter.senderId }).select("displayName").lean();
  return <main className="read-page"><header><Link className="brand" href="/mailbox"><span className="brand-mark">✉</span> dear, <i>letter</i></Link><Link className="text-link" href="/mailbox">← Back to mailbox</Link></header><article className={`read-letter paper-${letter.stationery}`}><div className="read-meta"><span>ARRIVED {formatLocalDate(letter.deliveredAt!, reader?.timezone||"UTC", { month: "long", day: "numeric", year: "numeric" })}</span><span>FROM {sender?.displayName || "SOMEONE DEAR"}</span></div>{letter.subject && <h1>{letter.subject}</h1>}<LetterReading greeting={letter.greeting} body={letter.body} signature={letter.signature} senderName={sender?.displayName||""} font={letter.fontPreference} ink={letter.ink}/><LetterPhotos letterId={String(letter._id)} count={letter.photos.length} /><div className="read-foot">SENT WITH CARE · DEAR, LETTER</div></article><LetterResponseTools id={String(letter._id)} initialFavorite={letter.favoriteBy.includes(userId)} initialReaction={letter.reaction?.emoji || ""} /><div className="read-actions"><Link className="button" href={`/write?replyTo=${letter.senderId}`}>Write back when you’re ready →</Link><Link className="text-link" href="/mailbox">Keep this letter in your mailbox</Link></div></main>;
}
