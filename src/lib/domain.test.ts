import { describe, expect, it } from "vitest";
import { canAccessLetterPhotos, canRecipientOpenLetter, deliveryDelayDays, profileUsernameBase, usernameAttempt } from "./domain";
import { letterSchema } from "./validators";
import { formatLocalDate } from "./dates";

describe("delayed delivery rules", () => {
  it("selects whole day delays from three through seven, inclusive", () => {
    expect([0, 0.2, 0.4, 0.6, 0.8, 0.999].map(n => deliveryDelayDays(() => n))).toEqual([3, 4, 5, 6, 7, 7]);
  });
});

describe("letter access rules", () => {
  const letter = { senderId: "sender", recipientId: "recipient", status: "scheduled" };
  it("keeps the recipient from opening a scheduled letter", () => {
    expect(canRecipientOpenLetter(letter, "recipient")).toBe(false);
  });
  it("allows only the intended recipient to open after delivery", () => {
    const delivered = { ...letter, status: "delivered" };
    expect(canRecipientOpenLetter(delivered, "recipient")).toBe(true);
    expect(canRecipientOpenLetter(delivered, "stranger")).toBe(false);
  });
  it("allows photo access to the sender and delivered recipient only", () => {
    expect(canAccessLetterPhotos(letter, "sender")).toBe(true);
    expect(canAccessLetterPhotos(letter, "recipient")).toBe(false);
    expect(canAccessLetterPhotos({ ...letter, status: "delivered" }, "recipient")).toBe(true);
    expect(canAccessLetterPhotos(letter, "stranger")).toBe(false);
  });
});

describe("letter validation", () => {
  it("preserves mixed Bangla and English Unicode letter content", () => {
    const body = "তোমার কথা মনে পড়ল today, so I wrote this little note.";
    const parsed = letterSchema.safeParse({ recipientId: "recipient", body });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.body).toBe(body);
  });
  it("limits a letter to five supported-size photographs", () => {
    const photos = Array.from({ length: 6 }, (_, i) => ({ publicId: `photo-${i}`, bytes: 20 }));
    expect(letterSchema.safeParse({ recipientId: "recipient", body: "A note", photos }).success).toBe(false);
  });
});

describe("local date formatting", () => {
  it("uses the recipient's timezone for timestamps", () => {
    const timestamp = "2026-01-01T01:00:00.000Z";
    expect(formatLocalDate(timestamp, "Asia/Dhaka", { month: "short", day: "numeric" })).toMatch(/Jan.*1|1.*Jan/);
    expect(formatLocalDate(timestamp, "America/Los_Angeles", { month: "short", day: "numeric" })).toMatch(/Dec.*31|31.*Dec/);
  });
});

describe("new profile usernames", () => {
  it("normalizes short or empty names into valid bases", () => {
    expect(profileUsernameBase("Jo", null)).toBe("jouser");
    expect(profileUsernameBase(null, "Li")).toBe("liuser");
    expect(profileUsernameBase(null, "!!!")).toBe("frienduser");
  });
  it("makes stable per-account usernames with room for collision retries", () => {
    const base = profileUsernameBase("averylongusernameexceeding", null);
    const first = usernameAttempt(base, "user_first", 0);
    const second = usernameAttempt(base, "user_second", 0);
    expect(first).not.toBe(second);
    expect(first.length).toBeLessThanOrEqual(24);
    expect(usernameAttempt(base, "user_first", 4)).not.toBe(first);
    expect(usernameAttempt(base, "user_first", 99).length).toBeLessThanOrEqual(24);
  });
});
