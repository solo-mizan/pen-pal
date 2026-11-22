import { Letter, Notification } from "@/models";
import { sendPendingLetterPushNotifications } from "@/lib/push";
export { deliveryDelayDays } from "@/lib/domain";

export async function deliverDueLetters(now = new Date()) {
  const due = await Letter.find({ status: "scheduled", deliverAt: { $lte: now } }).select("_id recipientId").lean();
  let delivered = 0;
  for (const letter of due) {
    const result = await Letter.updateOne({ _id: letter._id, status: "scheduled", deliverAt: { $lte: now } }, { $set: { status: "delivered", deliveredAt: now, pushNotificationPendingAt: now } });
    if (result.modifiedCount === 1) {
      delivered += 1;
      await Notification.updateOne({ userId: letter.recipientId, type: "letter_arrived", relatedId: String(letter._id) }, { $setOnInsert: { message: "A letter has arrived in your mailbox." } }, { upsert: true });
    }
  }
  await sendPendingLetterPushNotifications(now);
  return delivered;
}
