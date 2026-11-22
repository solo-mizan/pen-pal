import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Heart } from "lucide-react";
import { connectDB } from "@/lib/db";
import { clerkConfigured } from "@/lib/config";
import { Letter, User } from "@/models";
import { formatLocalDate } from "@/lib/dates";
import SiteHeader from "@/components/site-header";

export const dynamic = "force-dynamic";
export default async function FavoritesPage() {
  if (!clerkConfigured) redirect("/sign-in");
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  await connectDB();
  const self = await User.findOne({ clerkId: userId }).select("timezone").lean();
  const timezone = self?.timezone || "Asia/Dhaka";
  const letters = await Letter.find({ recipientId: userId, status: "delivered", favoriteBy: userId }).sort({ deliveredAt: -1 }).lean();
  const people = await User.find({ clerkId: { $in: letters.map(letter => letter.senderId) } }).select("clerkId displayName").lean();
  const names = new Map(people.map(person => [person.clerkId, person.displayName]));
  return <><SiteHeader /><main className="simple-page"><section className="simple-content">
    <div className="eyebrow"><span /> A FEW WORDS TO KEEP CLOSE</div><h1>Your favorites.</h1><p>Letters you’ve tucked somewhere special.</p>
    {letters.length ? <div className="letter-list">{letters.map(letter => <article className="letter-row" key={String(letter._id)}><div className="letter-icon opened"><Heart size={18} /></div><div className="letter-main"><b>{names.get(letter.senderId) || "Someone dear"}</b><span>{letter.subject || "A letter for you"}</span><small>Written {formatLocalDate(letter.sentAt || letter.createdAt, timezone, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</small></div><div className="letter-date">Arrived {formatLocalDate(letter.deliveredAt!, timezone, { weekday: "long", day: "numeric", month: "long" })}</div><Link className="open-link" href={`/letter/${letter._id}`}>Read again <span>↗</span></Link></article>)}</div> : <div className="empty-mail"><span>♡</span><h3>No favorites yet.</h3><p>When a letter feels like one to keep close, save it for later.</p><Link className="text-link" href="/mailbox">Back to your mailbox →</Link></div>}
  </section></main></>;
}
