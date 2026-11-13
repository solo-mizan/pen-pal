import { Letter, Notification, User } from "@/models";
export { deliveryDelayDays } from "@/lib/domain";

export async function deliverDueLetters(now = new Date()) {
  const due = await Letter.find({ status: "scheduled", deliverAt: { $lte: now } }).select("_id recipientId senderId subject").lean();
  let delivered = 0;
  for (const letter of due) {
    const result = await Letter.updateOne({ _id: letter._id, status: "scheduled", deliverAt: { $lte: now } }, { $set: { status: "delivered", deliveredAt: now } });
    if (result.modifiedCount === 1) {
      delivered += 1;
      await Notification.updateOne({ userId: letter.recipientId, type: "letter_arrived", relatedId: String(letter._id) }, { $setOnInsert: { message: "A letter has arrived in your mailbox." } }, { upsert: true });
      try {
        const recipient = await User.findOne({ clerkId: letter.recipientId }).select("email displayName notifications").lean();
        if (recipient?.email && recipient.notifications?.emailLetters && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
          const { Resend } = await import("resend");
          await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.EMAIL_FROM, to: recipient.email, subject: "A letter has arrived for you", html: `<div style="font-family:Georgia,serif;background:#f8f5ef;padding:40px;color:#302c27"><h1 style="font-weight:400">A letter has arrived.</h1><p>There’s a little something waiting in your dear, letter mailbox.</p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://example.com"}/mailbox" style="display:inline-block;margin-top:12px;padding:13px 18px;background:#62694f;color:#fff;text-decoration:none">Open your mailbox</a></div>` });
        }
      } catch (error) { console.error("Letter arrival email failed", error); }
    }
  }
  return delivered;
}

export async function sendWritingReminders(now = new Date()) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return 0;
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const candidates = await User.find({ "notifications.writingReminders": true, createdAt: { $lte: cutoff }, $or: [{ lastWritingReminderAt: { $exists: false } }, { lastWritingReminderAt: { $lte: cutoff } }] }).select("_id clerkId email displayName lastWritingReminderAt").limit(100).lean();
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (const user of candidates) {
    const recentLetter = await Letter.exists({ senderId: user.clerkId, sentAt: { $gte: cutoff } });
    if (recentLetter) continue;
    const claim = await User.updateOne({ _id: user._id, $or: [{ lastWritingReminderAt: { $exists: false } }, { lastWritingReminderAt: { $lte: cutoff } }] }, { $set: { lastWritingReminderAt: now } });
    if (claim.modifiedCount !== 1 || !user.email) continue;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";
    try {
      await resend.emails.send({ from: process.env.EMAIL_FROM, to: user.email, subject: "A little hello, whenever you have time", html: `<div style="font-family:Georgia,serif;background:#f8f5ef;padding:40px;color:#302c27"><h1 style="font-weight:400">No rush. Just a thought.</h1><p>If someone dear has been on your mind, your mailbox is here when you feel like writing.</p><a href="${appUrl}/write" style="display:inline-block;margin-top:12px;padding:13px 18px;background:#62694f;color:#fff;text-decoration:none">Write a letter</a><p style="font-size:12px;color:#888">You can turn off writing reminders in your mailbox settings.</p></div>` });
      sent += 1;
    } catch (error) { console.error("Writing reminder email failed", error); }
  }
  return sent;
}
