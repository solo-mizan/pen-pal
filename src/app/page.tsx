import Link from "next/link";
import { ArrowRight, Clock3, Feather, Mail, MailOpen, Send, ShieldCheck, Sparkles } from "lucide-react";
import ArrivalBadge from "@/components/arrival-badge";
import AuthControls from "@/components/auth-controls";
import HomeMailboxCta from "@/components/home-mailbox-cta";

const steps = [
  { icon: Feather, n: "01", title: "Write something real", body: "Take a breath. Find the right words. Add a photograph if you like." },
  { icon: Send, n: "02", title: "Send it on its way", body: "Choose someone you’ve connected with. Your letter gets a journey of its own." },
  { icon: MailOpen, n: "03", title: "Let the waiting be part of it", body: "Two to three days later, a little piece of you arrives in their mailbox." },
];

export default function Home() {
  return (
    <main className="landing">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark"><Mail size={18} /></span> dear, <i>letter</i></Link>
        <nav><a href="#how-it-works">How it works</a><a href="#why-letters">Our little idea</a></nav>
        <div className="top-actions"><AuthControls /></div>
      </header>

      <section className="hero" id="why-letters">
        <div className="hero-copy">
          <div className="eyebrow"><span /> A slower kind of connection</div>
          <h1>Some things<br />are worth <em>waiting for.</em></h1>
          <p className="hero-text">A quiet place to write to the people you love. Your letters take the long way there — so the anticipation becomes part of the gift.</p>
          <div className="hero-buttons"><HomeMailboxCta className="button">Send a little something <ArrowRight size={16} /></HomeMailboxCta><a className="text-link" href="#how-it-works">See how it works <span>↓</span></a></div>
          <div className="hero-note"><span className="avatars"><b>A</b><b>M</b><b>✿</b></span><span>Made for the people<br />you think about most.</span></div>
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
        <div className="hero-foot"><span>01 — A POSTAL PAUSE</span><span>Letters travel in 2–3 days</span><span>SCROLL TO WANDER ↓</span></div>
      </section>

      <section className="belief" id="how-it-works">
        <div className="section-kicker">A small rebellion against instant</div>
        <h2>Not another thing to keep up with.<br /><em>Something to look forward to.</em></h2>
        <p className="belief-copy">The best letters aren’t typed between errands. They’re written when you have a moment, carried by time, and opened when the day needs a little warmth.</p>
        <div className="steps">{steps.map(({ icon: Icon, n, title, body }) => <article className="step" key={n}><div className="step-top"><span>{n}</span><Icon size={19} strokeWidth={1.5} /></div><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="promise">
        <div className="promise-art"><div className="paper-note"><span>Tuesday, 8:42 pm</span><p>“A cut flower would have faded long ago, so you gave me a plant instead. Every fresh bloom still reminds me of you, cutie pie.”</p><small>— a note that took its time</small></div><span className="pressed-flower">✿</span></div>
        <div className="promise-copy"><div className="eyebrow"><span /> A note, not a notification</div><h2>Give a thought<br />some <em>room to land.</em></h2><p>No typing bubbles. No pressure to reply right away. Just a letter, sealed until its time, and a person who knows you thought of them.</p><div className="promise-list"><span><ShieldCheck size={16} /> Private between you two</span><span><Clock3 size={16} /> Delivered in 2–3 days</span><span><Sparkles size={16} /> Yours to keep, always</span></div></div>
      </section>

      <section className="closing"><span className="closing-stamp">✳</span><div className="section-kicker">The mailbox is waiting</div><h2>Someone would love<br />to hear from <em>you.</em></h2><HomeMailboxCta className="button">Make your mailbox <ArrowRight size={16} /></HomeMailboxCta><small>Free to start · Always personal</small></section>
      <footer className="footer"><Link className="brand" href="/"><span className="brand-mark"><Mail size={17} /></span> dear, <i>letter</i></Link><span>Made slowly, for the people who matter.</span><span>© 2026 dear, letter</span></footer>
    </main>
  );
}
