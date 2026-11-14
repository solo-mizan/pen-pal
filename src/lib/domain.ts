import { createHash } from "node:crypto";

export function deliveryDelayDays(random = Math.random): number {
  return 3 + Math.floor(random() * 5);
}

export function profileUsernameBase(username: string | null | undefined, firstName: string | null | undefined) {
  const candidate = (username || firstName || "letterfriend").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18);
  return candidate.length >= 3 ? candidate : `${candidate || "friend"}user`.slice(0, 24);
}

export function usernameAttempt(base: string, clerkId: string, attempt: number) {
  const stableSuffix = createHash("sha256").update(clerkId).digest("hex").slice(0, 8);
  const collisionSuffix = attempt === 0 ? "" : String(attempt + 1);
  const suffix = `_${stableSuffix}${collisionSuffix}`;
  return `${base.slice(0, 24 - suffix.length)}${suffix}`;
}

export function canRecipientOpenLetter(letter: { recipientId: string; status: string }, viewerId: string) {
  return letter.recipientId === viewerId && letter.status === "delivered";
}

export function canAccessLetterPhotos(letter: { senderId: string; recipientId: string; status: string }, viewerId: string) {
  return letter.senderId === viewerId || canRecipientOpenLetter(letter, viewerId);
}
