"use server";

import { revalidatePath } from "next/cache";
import { isSiteAdmin } from "@/lib/admin";
import { connectDB } from "@/lib/db";
import { deliverDueLetters } from "@/lib/delivery";
import { AppSettings } from "@/models";

type DeliverySettingsInput = { mode: "random" | "instant"; minDays: number; maxDays: number };

function parseDeliverySettings(input: unknown): DeliverySettingsInput | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  if (value.mode !== "random" && value.mode !== "instant") return null;
  if (typeof value.minDays !== "number" || typeof value.maxDays !== "number" || !Number.isInteger(value.minDays) || !Number.isInteger(value.maxDays)) return null;
  const minDays = value.minDays;
  const maxDays = value.maxDays;
  if (minDays < 0 || maxDays > 30 || minDays > maxDays) return null;
  return { mode: value.mode, minDays, maxDays };
}

export async function saveGlobalDeliverySettings(input: unknown) {
  if (!await isSiteAdmin()) return { ok: false, error: "You do not have permission to change delivery settings." };
  const settings = parseDeliverySettings(input);
  if (!settings) return { ok: false, error: "Choose a valid delivery mode and a range from 0 to 30 days." };
  try {
    await connectDB();
    await AppSettings.updateOne({ _id: "global" }, { $set: { deliveryMode: settings.mode, deliveryMinDays: settings.minDays, deliveryMaxDays: settings.maxDays } }, { upsert: true, runValidators: true });
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save the delivery settings." };
  }
}

export async function processDueLettersNow() {
  if (!await isSiteAdmin()) return { ok: false, error: "You do not have permission to process deliveries." };
  try {
    await connectDB();
    const delivered = await deliverDueLetters();
    revalidatePath("/admin");
    revalidatePath("/mailbox");
    revalidatePath("/outbox");
    return { ok: true, delivered };
  } catch {
    return { ok: false, error: "Could not process due letters." };
  }
}
