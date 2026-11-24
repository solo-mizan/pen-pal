import { Letter, Notification } from "@/models";
import { sendPendingLetterPushNotifications } from "@/lib/push";
export { deliveryDelayDays } from "@/lib/domain";

async function deliverScheduledLetters(now: Date, dueOnly: boolean) {
  const filter = dueOnly ? { status: "scheduled", deliverAt: { $lte: now } } : { status: "scheduled" };
  const due = await Letter.find(filter).select("_id recipientId").lean();
  let delivered = 0;
  for (const letter of due) {
    const updateFilter = dueOnly
      ? { _id: letter._id, status: "scheduled", deliverAt: { $lte: now } }
      : { _id: letter._id, status: "scheduled" };
    const result = await Letter.updateOne(updateFilter, { $set: { status: "delivered", deliveredAt: now, pushNotificationPendingAt: now } });
    if (result.modifiedCount === 1) {
      delivered += 1;
      await Notification.updateOne({ userId: letter.recipientId, type: "letter_arrived", relatedId: String(letter._id) }, { $setOnInsert: { message: "A letter has arrived in your mailbox." } }, { upsert: true });
    }
  }
  await sendPendingLetterPushNotifications(now);
  return delivered;
}

export function deliverDueLetters(now = new Date()) {
  return deliverScheduledLetters(now, true);
}

export function deliverAllScheduledLettersNow(now = new Date()) {
  return deliverScheduledLetters(now, false);
}
