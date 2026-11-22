import { describe, expect, it } from "vitest";
import { parsePushSubscription } from "./push-subscription";

describe("parsePushSubscription", () => {
  it("accepts the browser PushSubscription JSON including a null expirationTime", () => {
    expect(parsePushSubscription({
      endpoint: "https://fcm.googleapis.com/fcm/send/example-token",
      expirationTime: null,
      keys: { p256dh: "B".repeat(65), auth: "A".repeat(22) },
    })).toEqual({
      endpoint: "https://fcm.googleapis.com/fcm/send/example-token",
      expirationTime: null,
      keys: { p256dh: "B".repeat(65), auth: "A".repeat(22) },
    });
  });

  it("does not accept insecure or unsupported push endpoints", () => {
    expect(parsePushSubscription({
      endpoint: "http://fcm.googleapis.com/fcm/send/example-token",
      expirationTime: null,
      keys: { p256dh: "B".repeat(65), auth: "A".repeat(22) },
    })).toBeNull();
  });
});
