import Link from "next/link";
import { ArrowRight, Clock3, Feather, Mail, MailOpen, Send, ShieldCheck, Sparkles } from "lucide-react";
import ArrivalBadge from "@/components/arrival-badge";
import SiteHeader from "@/components/site-header";
import HomeMailboxCta from "@/components/home-mailbox-cta";

const steps = [
  { icon: Feather, title: "Write", note: "Take an evening. Say what you mean." },
  { icon: Send, title: "Seal & post", note: "Send your words on their way." },
  { icon: Clock3, title: "On its way", note: "The letter travels for 2–3 days." },
  { icon: MailOpen, title: "It arrives", note: "A little piece of you is waiting." },
  { icon: Feather, title: "They write back", note: "Another 2–3 days. About a week for one conversation." },
];

export default function Home() {
  return (
    <main className="landing">
      <SiteHeader />
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> A slower kind of connection</div>
          <h1>Some things<br />are worth <em>waiting for.</em></h1>
          <p className="hero-text">Instead of another quick “hi, hello, what’s up,” write the words you want someone you love to keep.</p>
          <div className="hero-buttons">
            <HomeMailboxCta className="button" signedInChildren={<><Mail size={18} /> Open your mailbox <ArrowRight size={16} /></>}><Feather size={17} /> Write your first letter <ArrowRight size={16} /></HomeMailboxCta>
            <a className="text-link" href="#how-it-works">How it works <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-note"><span className="avatars"><b>A</b><b>M</b><b>✿</b></span><span>For partners, family,<br />and friends held close.</span></div>
        </div>
        <div className="hero-art" aria-label="Illustration of a letter waiting to be opened">
          <div className="sun-wash" />
          <div className="postmark">POSTED WITH<br /><strong>A LITTLE LOVE</strong><span>✳</span></div>
          <div className="flower flower-one">✿</div><div className="flower flower-two">✾</div>
          <div className="envelope">
            <div className="letter-peek"><div className="stamp"><span>✳</span><small>POST<br />WITH<br />LOVE</small></div><div className="peek-lines"><i /><i /><i /></div></div>
            <div className="env-back" /><div className="env-flap" /><div className="wax-seal">d</div>
          </div>
          <ArrivalBadge />
          <span className="scribble">xoxo</span><span className="tiny-star">✦</span>
        </div>
        <div className="hero-foot"><span>A POSTAL PAUSE</span><span>Written slowly · Carried by time</span><span>MAKE ROOM FOR A LETTER ↓</span></div>
      </section>

      <section className="belief story-problem" id="how-it-works">
        <div className="section-kicker">A little room for what matters</div>
        <h2>Messages are fast.<br /><em>Love isn’t.</em></h2>
        <p className="belief-copy">A “hi” takes a second and is gone in a minute. A letter takes an evening to write, and can stay with you for a lifetime.</p>
        <div className="steps story-timeline">{steps.map(({ icon: Icon, title, note }, index) => <article className="step" key={title}><div className="step-top"><span>0{index + 1}</span><Icon size={20} strokeWidth={1.5} /></div><h3>{title}</h3><p>{note}</p></article>)}</div>
      </section>

      <section className="promise story-promise" id="our-little-idea">
        <div className="promise-art"><div className="paper-note"><span>Written on Friday, 20 November 2026</span><h3>My dear,</h3><p>I passed the little bookshop on the corner today. The one where we lost an hour choosing postcards. I could almost hear you laughing at how seriously I read every one.</p><p>I miss the way an ordinary afternoon changes when I get to spend it beside you. I’m saving a story for the next time we walk that street together.</p><small>Yours always,<br />Mizan</small></div><span className="pressed-flower">✿</span></div>
        <div className="promise-copy"><div className="eyebrow"><span /> OUR LITTLE IDEA</div><h2>Not a chat.<br /><em>A letter to keep.</em></h2><p>There are no feeds to scroll, likes to collect, typing bubbles, last-seen lights, or ads. Write it, send it, then go live your day.</p><div className="promise-list"><span><ShieldCheck size={18} /> Just between your people</span><span><Clock3 size={18} /> It takes 2–3 days to arrive</span><span><Sparkles size={18} /> Yours to keep, always</span></div></div>
      </section>

      <section className="closing"><span className="closing-stamp">✳</span><div className="section-kicker">THE POST IS YOURS</div><h2>Your mailbox<br />is <em>waiting.</em></h2><p>There’s someone you’d like to tell more than “what’s up.”</p><HomeMailboxCta className="button" signedInChildren={<><Mail size={18} /> Open your mailbox <ArrowRight size={16} /></>}><Feather size={17} /> Write your first letter <ArrowRight size={16} /></HomeMailboxCta></section>
      <footer className="footer"><Link className="brand" href="/"><span className="brand-mark"><Mail size={17} /></span> dear, <i>letter</i></Link><span>Made slowly, for the people who matter.</span><span>© 2026 dear, letter</span></footer>
    </main>
  );
}
