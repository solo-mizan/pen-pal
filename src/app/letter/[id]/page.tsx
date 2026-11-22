import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { deliverDueLetters } from "@/lib/delivery";
import { Letter, User } from "@/models";
import LetterPhotos from "@/components/letter-photos";
import LetterResponseTools from "@/components/letter-response-tools";
import LetterReading from "@/components/letter-reading";
import LetterOpening from "@/components/letter-opening";
import SiteHeader from "@/components/site-header";
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
  const timezone = reader?.timezone || "Asia/Dhaka";
  const writtenDate = formatLocalDate(letter.sentAt || letter.createdAt, timezone, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const arrivalDate = formatLocalDate(letter.deliveredAt!, timezone, { weekday: "long", day: "numeric", month: "long" });
  return <><SiteHeader /><main className="read-page">
    <LetterOpening><article className={`read-letter paper-${letter.stationery}`}><div className="letter-dated-post"><div><span>WRITTEN AND POSTED</span><strong>Written on {writtenDate}</strong><small>Arrived {arrivalDate}</small></div><div className="postmark-stamp" aria-label={`Postmark for ${writtenDate}`}><span>✳</span><b>DEAR<br />LETTER</b><small>{formatLocalDate(letter.sentAt || letter.createdAt, timezone, { month: "short", day: "numeric", year: "numeric" })}</small></div></div><div className="read-meta"><span>FROM {sender?.displayName || "SOMEONE DEAR"}</span><span>KEPT WITH CARE</span></div>{letter.subject && <h1>{letter.subject}</h1>}<LetterReading greeting={letter.greeting} body={letter.body} signature={letter.signature} senderName={sender?.displayName||""} font={letter.fontPreference} ink={letter.ink}/><LetterPhotos letterId={String(letter._id)} count={letter.photos.length} /><div className="read-foot">SENT WITH CARE · DEAR, LETTER</div></article></LetterOpening>
    <LetterResponseTools id={String(letter._id)} initialFavorite={letter.favoriteBy.includes(userId)} /><div className="read-actions"><Link className="button" href={`/write?replyTo=${letter.senderId}`}>Post a reply when you’re ready →</Link><Link className="text-link" href="/mailbox">Keep this letter in your mailbox</Link></div>
  </main></>;
}
