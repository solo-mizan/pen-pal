import { RateLimit } from "@/models";

export async function consumeRateLimit(userId: string, operation: string, limit: number, windowMs: number, now = Date.now()) {
  const bucket = Math.floor(now / windowMs);
  const key = `${userId}:${operation}:${bucket}`;
  const expiresAt = new Date((bucket + 2) * windowMs);
  try {
    await RateLimit.updateOne({ _id: key }, { $inc: { count: 1 }, $setOnInsert: { expiresAt } }, { upsert: true });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    await RateLimit.updateOne({ _id: key }, { $inc: { count: 1 } });
  }
  const record = await RateLimit.findById(key).select("count").lean();
  return Boolean(record && record.count <= limit);
}
