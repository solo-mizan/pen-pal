import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Clock3, Mail, Send } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Letter, User } from "@/models";
import { clerkConfigured } from "@/lib/config";
import { formatLocalDate } from "@/lib/dates";
import SiteHeader from "@/components/site-header";

export const dynamic = "force-dynamic";
export default async function OutboxPage() {
  if (!clerkConfigured) redirect("/sign-in");
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  await connectDB();
  const self = await User.findOne({ clerkId: userId }).select("timezone").lean();
  const timezone = self?.timezone || "Asia/Dhaka";
  const letters = await Letter.find({ senderId: userId, status: { $in: ["scheduled", "delivered"] } }).sort({ sentAt: -1 }).limit(50).lean();
  const recipients = await User.find({ clerkId: { $in: letters.map(letter => letter.recipientId) } }).select("clerkId displayName").lean();
  const names = new Map(recipients.map(person => [person.clerkId, person.displayName]));
  return <><SiteHeader /><main className="simple-page"><section className="simple-content">
    <div className="eyebrow"><span /> YOUR SIDE OF THE POST</div><h1>Sent with care.</h1><p>Each letter, on its way to someone dear.</p>
    {letters.length ? <div className="letter-list">{letters.map(letter => {
      const sentDate = formatLocalDate(letter.sentAt || letter.createdAt, timezone, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const arrives = formatLocalDate(letter.deliverAt || letter.deliveredAt!, timezone, { weekday: "long", day: "numeric", month: "long" });
      return <article className="letter-row outbox-row" key={String(letter._id)}><div className="letter-icon sealed"><Send size={19} /></div><div className="letter-main"><b>To {names.get(letter.recipientId) || "your person"}</b><span>{letter.subject || "A little letter"}</span><small>Written on {sentDate}</small></div><div className="letter-status-wrap"><div className="letter-subject">{letter.status === "scheduled" ? "In the post" : "Delivered"}</div><div className="letter-date">{letter.status === "scheduled" ? <><Clock3 size={15} /> Arrives around {arrives}</> : `Arrived ${formatLocalDate(letter.deliveredAt!, timezone, { weekday: "long", day: "numeric", month: "long" })}`}</div></div><span className="postmark-mini" aria-label={`Posted ${sentDate}`}><Mail size={16} /><small>POSTED</small></span></article>;
    })}</div> : <div className="empty-mail"><span>✉</span><h3>No letters posted yet.</h3><p>There’s no hurry. Write when the words are ready.</p><Link className="button" href="/write">Post a letter</Link></div>}
  </section></main></>;
}
