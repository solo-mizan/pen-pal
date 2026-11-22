import { Letter, PushSubscription as PushSubscriptionRecord, User } from "@/models";
import { formatLocalDate } from "@/lib/dates";
import { randomUUID } from "node:crypto";

const CLAIM_LEASE_MS = 10 * 60 * 1000;

function pushConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  return publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null;
}

export function isPushConfigured() {
  return Boolean(pushConfig());
}

export async function sendPendingLetterPushNotifications(now = new Date()) {
  const config = pushConfig();
  if (!config) return 0;

  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  const staleClaim = new Date(now.getTime() - CLAIM_LEASE_MS);
  const candidates = await Letter.find({ status: "delivered", pushNotificationPendingAt: { $exists: true }, pushNotifiedAt: { $exists: false } })
    .select("_id recipientId senderId sentAt")
    .sort({ deliveredAt: 1 })
    .limit(100)
    .lean();
  let notified = 0;

  for (const candidate of candidates) {
    const claimId = randomUUID();
    const claimed = await Letter.findOneAndUpdate(
      {
        _id: candidate._id,
        status: "delivered",
        pushNotificationPendingAt: { $exists: true },
        pushNotifiedAt: { $exists: false },
        $or: [{ pushNotificationClaimedAt: { $exists: false } }, { pushNotificationClaimedAt: { $lte: staleClaim } }],
      },
      { $set: { pushNotificationClaimedAt: now, pushNotificationClaimId: claimId } },
      { new: true },
    ).lean();
    if (!claimed) continue;

    const subscriptions = await PushSubscriptionRecord.find({ userId: candidate.recipientId }).lean();
    if (!subscriptions.length) {
      await Letter.updateOne({ _id: candidate._id, pushNotificationClaimId: claimId }, { $set: { pushNotifiedAt: now }, $unset: { pushNotificationClaimedAt: 1, pushNotificationClaimId: 1 } });
      continue;
    }

    const [sender, recipient] = await Promise.all([
      User.findOne({ clerkId: candidate.senderId }).select("displayName").lean(),
      User.findOne({ clerkId: candidate.recipientId }).select("timezone").lean(),
    ]);
    const senderName = sender?.displayName || "Someone dear";
    const writtenDate = formatLocalDate(candidate.sentAt || now, recipient?.timezone || "Asia/Dhaka", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const payload = JSON.stringify({
      title: "A letter has arrived 💌",
      body: `${senderName} wrote to you on ${writtenDate}.`,
      url: "/mailbox",
      tag: `letter-${String(candidate._id)}`,
    });
    let retry = false;

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: subscription.keys },
          payload,
          { TTL: 60 * 60 * 24, urgency: "normal", topic: String(candidate._id) },
        );
      } catch (error) {
        const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscriptionRecord.deleteOne({ _id: subscription._id });
        } else {
          retry = true;
          console.error("Letter push notification failed", { letterId: String(candidate._id), statusCode });
        }
      }
    }

    if (retry) {
      await Letter.updateOne({ _id: candidate._id, pushNotificationClaimId: claimId }, { $unset: { pushNotificationClaimedAt: 1, pushNotificationClaimId: 1 } });
      continue;
    }

    const completed = await Letter.updateOne(
      { _id: candidate._id, pushNotifiedAt: { $exists: false }, pushNotificationClaimId: claimId },
      { $set: { pushNotifiedAt: now }, $unset: { pushNotificationClaimedAt: 1, pushNotificationClaimId: 1 } },
    );
    if (completed.modifiedCount === 1) notified += 1;
  }

  return notified;
}
