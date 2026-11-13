export function deliveryDelayDays(random = Math.random): number {
  return 3 + Math.floor(random() * 5);
}

export function canRecipientOpenLetter(letter: { recipientId: string; status: string }, viewerId: string) {
  return letter.recipientId === viewerId && letter.status === "delivered";
}

export function canAccessLetterPhotos(letter: { senderId: string; recipientId: string; status: string }, viewerId: string) {
  return letter.senderId === viewerId || canRecipientOpenLetter(letter, viewerId);
}
