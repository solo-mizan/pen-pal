import { z } from "zod";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(16).max(256),
    auth: z.string().min(8).max(256),
  }),
});

function supportedPushEndpoint(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (
      host === "fcm.googleapis.com" ||
      host.endsWith(".push.services.mozilla.com") ||
      host.endsWith(".push.apple.com") ||
      host.endsWith(".notify.windows.com")
    );
  } catch {
    return false;
  }
}

export function parsePushSubscription(value: unknown) {
  const parsed = pushSubscriptionSchema.safeParse(value);
  if (!parsed.success || !supportedPushEndpoint(parsed.data.endpoint)) return null;
  return parsed.data;
}
