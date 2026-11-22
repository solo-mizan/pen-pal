import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Clock3, Feather, Mail, MailOpen, Send, Settings, ShieldCheck, Users } from "lucide-react";
import { connectDB } from "@/lib/db";
import { requireAppUser } from "@/lib/auth";
import { deliverDueLetters } from "@/lib/delivery";
import { Connection, Letter, User } from "@/models";
import { clerkConfigured } from "@/lib/config";
import { formatLocalDate } from "@/lib/dates";
import { isAdminEmail } from "@/lib/admin";
import SiteHeader from "@/components/site-header";
import PushControl from "@/components/push-control";

export const dynamic = "force-dynamic";
export default async function MailboxPage() {
  if (!clerkConfigured) return <main className="auth-needed"><span>✉</span><h1>Your mailbox is almost ready.</h1><p>Add the Clerk keys from `.env.example` to enable your private mailbox.</p><Link className="button" href="/sign-in">Continue to sign in</Link></main>;
  const { userId } = await auth();
  if (!userId) return <main className="auth-needed"><span>✉</span><h1>Your mailbox is just around the corner.</h1><p>Sign in to see letters from your people.</p><Link className="button" href="/sign-in">Log in</Link></main>;
  const self = await requireAppUser();
  await connectDB();
  await deliverDueLetters();
  const [letters, connections] = await Promise.all([
    Letter.find({ recipientId: userId, status: { $in: ["scheduled", "delivered"] } }).sort({ status: 1, deliverAt: -1 }).limit(30).lean(),
    Connection.find({ participants: userId, status: "accepted" }).lean(),
  ]);
  const otherIds = connections.map((c: { participants: string[] }) => c.participants.find((id: string) => id !== userId)).filter(Boolean);
  const people = await User.find({ clerkId: { $in: [...otherIds, ...letters.map(l => l.senderId)] } }).lean();
  const names = new Map(people.map((person: { clerkId: string; displayName: string }) => [person.clerkId, person.displayName]));
  const pending = letters.filter(l => l.status === "scheduled");
  const arrived = letters.filter(l => l.status === "delivered");
  return <><SiteHeader unreadCount={arrived.filter(l=>!l.openedAt).length}/><main className="mailbox-app"><aside className="mail-sidebar"><Link className="brand" href="/"><span className="brand-mark"><Mail size={17}/></span> dear, <i>letter</i></Link><div className="sidebar-label">YOUR POST</div><Link className="side-link active" href="/mailbox"><Mail size={16}/> Mailbox <span>{arrived.filter(l=>!l.openedAt).length}</span></Link><Link className="side-link" href="/outbox"><Send size={16}/> Sent letters</Link><Link className="side-link" href="/connections"><Users size={16}/> Your people</Link><Link className="side-link" href="/settings"><Settings size={16}/> Settings</Link>{isAdminEmail(self.email)&&<Link className="side-link" href="/admin"><ShieldCheck size={16}/> Admin panel</Link>}<div className="sidebar-bottom"><div className="tiny-profile">{self.displayName.slice(0,1).toUpperCase()}</div><div><b>{self.displayName}</b><small>@{self.username}</small></div><Link className="logout" href="/settings" aria-label="Settings">↗</Link></div></aside>
    <section className="mail-content"><div className="mail-top"><div><div className="eyebrow"><span/> YOUR MAILBOX</div><h1>Good to see you, {self.displayName.split(" ")[0]}.</h1><p>A little room for the words that matter.</p></div><Link className="button" href="/write"><Feather size={17}/> Write a letter</Link></div>
      <PushControl userId={userId} />
      <div className="mail-stats"><div><span>WAITING TO ARRIVE</span><b>{pending.length.toString().padStart(2,"0")}</b><small>on their way to you</small></div><div><span>LETTERS RECEIVED</span><b>{arrived.length.toString().padStart(2,"0")}</b><small>little pieces to keep</small></div><div><span>YOUR PEOPLE</span><b>{connections.length.toString().padStart(2,"0")}</b><small>close connections</small></div></div>
      <div className="mail-section-heading"><div><span className="section-kicker">THE POST HAS BEEN BUSY</span><h2>Your letters</h2></div><div className="mail-heading-links"><Link href="/favorites">Saved favorites</Link><Link href="/outbox">View sent letters →</Link></div></div>
      {letters.length ? <div className="letter-list">{letters.map(letter => { const sender=names.get(letter.senderId)||"Someone dear"; const isSealed=letter.status==="scheduled"; const written=formatLocalDate(letter.sentAt||letter.createdAt,self.timezone,{weekday:"long",day:"numeric",month:"long",year:"numeric"}); return <article className="letter-row" key={String(letter._id)}><div className={`letter-icon ${isSealed?"sealed":"opened"}`}>{isSealed?<Mail size={19}/>:<MailOpen size={19}/>}</div><div className="letter-main"><b>{sender}</b><span>{isSealed?"A letter is making its way to you":"A letter has arrived"}</span><small>Written {written}</small></div><div className="letter-subject">{isSealed?"Sealed for now":letter.subject||"A letter for you"}</div><div className="letter-date">{isSealed?<><Clock3 size={15}/> Arrives {formatLocalDate(letter.deliverAt!,self.timezone,{month:"short",day:"numeric"})}</>:formatLocalDate(letter.deliveredAt!,self.timezone,{month:"short",day:"numeric"})}</div>{isSealed?<span className="sealed-pill">IN THE POST</span>:<Link className="open-link" href={`/letter/${letter._id}`}>Open <span>↗</span></Link>}</article>; })}</div>:<div className="empty-mail"><span>✉</span><h3>The postman hasn’t come by yet.</h3><p>There’s no need to check back. Your letters will be here when they arrive.</p><Link className="text-link" href="/connections">Find your people <span>→</span></Link></div>}
      <div className="gentle-note"><span>✳</span><p>Write it, send it, then go live your day.</p></div>
    </section></main></>;
}
