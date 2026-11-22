import { AppSettings } from "@/models";
import type { DeliverySettings } from "@/lib/domain";

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = { mode: "random", minDays: 2, maxDays: 3 };

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const saved = await AppSettings.findById("global").lean();
  if (!saved) return DEFAULT_DELIVERY_SETTINGS;
  return {
    mode: saved.deliveryMode === "instant" ? "instant" : "random",
    minDays: saved.deliveryMinDays ?? DEFAULT_DELIVERY_SETTINGS.minDays,
    maxDays: saved.deliveryMaxDays ?? DEFAULT_DELIVERY_SETTINGS.maxDays,
  };
}
