import { z } from "zod";
import { MAX_LETTER_BODY_CHARACTERS } from "./letter-limits";

export const profileSchema = z.object({ username: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/), displayName: z.string().trim().min(1).max(60) });
export const preferencesSchema = profileSchema.extend({ preferredLanguage: z.enum(["en","bn"]), timezone: z.string().trim().min(1).max(80).refine(value => { try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; } }, "Choose a valid timezone, such as Asia/Dhaka."), profileVisible: z.boolean() });
export const connectionSchema = z.object({ username: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/) });
export const letterSchema = z.object({
  recipientId: z.string().min(1), subject: z.string().trim().max(100).default(""), greeting: z.string().trim().max(120).default(""),
  body: z.string().trim().min(1).max(MAX_LETTER_BODY_CHARACTERS), signature: z.string().trim().max(120).default(""),
  stationery: z.enum(["cream", "vintage", "pastel", "white", "blue"]).default("cream"), fontPreference: z.enum(["caveat", "atma", "serif"]).default("caveat"),
  ink: z.enum(["brown", "sage", "blue", "rose"]).default("brown"), photos: z.array(z.object({ publicId: z.string().min(1), format: z.string().optional(), width: z.number().int().positive().optional(), height: z.number().int().positive().optional(), bytes: z.number().int().positive().max(10_485_760), secureUrl: z.string().url().optional() })).max(5).default([]),
});
