"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { deliveryDelayDays, deliverDueLetters } from "@/lib/delivery";
import { requireAppUser } from "@/lib/auth";
import { Connection, Letter, Notification, User } from "@/models";
import { connectionSchema, letterSchema, preferencesSchema, profileSchema } from "@/lib/validators";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function saveProfile(input: unknown) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose a valid name and username (3–24 letters, numbers or underscores)." };
  try {
    const user = await requireAppUser();
    const existing = await User.findOne({ username: parsed.data.username.toLowerCase(), clerkId: { $ne: user.clerkId } }).lean();
    if (existing) return { ok: false, error: "That username is already taken." };
    await User.updateOne({ clerkId: user.clerkId }, { $set: { username: parsed.data.username.toLowerCase(), displayName: parsed.data.displayName } });
    revalidatePath("/mailbox");
    return { ok: true };
  } catch { return { ok: false, error: "Could not save your profile. Please try again." }; }
}

export async function updatePreferences(input: unknown) {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the profile details and try again." };
  try {
    const user = await requireAppUser();
    const { emailLetters, emailConnections, writingReminders, ...profile } = parsed.data;
    const duplicate = await User.findOne({ username: profile.username.toLowerCase(), clerkId: { $ne: user.clerkId } }).lean();
    if (duplicate) return { ok: false, error: "That username is already taken." };
    await User.updateOne({ clerkId: user.clerkId }, { $set: { ...profile, username: profile.username.toLowerCase(), notifications: { emailLetters, emailConnections, writingReminders } } });
    revalidatePath("/settings"); revalidatePath("/mailbox");
    return { ok: true };
  } catch { return { ok: false, error: "Could not save your settings." }; }
}

export async function sendConnectionRequest(input: unknown) {
  const parsed = connectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid username." };
  try {
    const user = await requireAppUser();
    if (!await consumeRateLimit(user.clerkId, "connection-request", 5, 60 * 60 * 1000)) return { ok: false, error: "Please wait a little before sending more requests." };
    const target = await User.findOne({ username: parsed.data.username.toLowerCase(), profileVisible: true }).lean();
    if (!target || target.clerkId === user.clerkId) return { ok: false, error: "We couldn’t find that person." };
    const pair = [user.clerkId, target.clerkId].sort();
    const pairKey = pair.join(":");
    const existing = await Connection.findOne({ pairKey });
    if (existing?.status === "accepted") return { ok: false, error: "You’re already connected." };
    if (existing?.status === "pending") return { ok: false, error: "A request is already waiting." };
    if (existing) { existing.status = "pending"; existing.requesterId = user.clerkId; existing.recipientId = target.clerkId; await existing.save(); }
    else await Connection.create({ participants: pair, pairKey, requesterId: user.clerkId, recipientId: target.clerkId });
    await Notification.create({ userId: target.clerkId, type: "connection_request", relatedId: user.clerkId, message: `${user.displayName} would like to exchange letters.` });
    if (target.email && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      try {
        const preferences = await User.findOne({ clerkId: target.clerkId }).select("notifications.emailConnections").lean();
        if (preferences?.notifications?.emailConnections) {
          const { Resend } = await import("resend");
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";
          await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.EMAIL_FROM, to: target.email, subject: "Someone would like to connect", html: `<div style="font-family:Georgia,serif;background:#f8f5ef;padding:40px;color:#302c27"><h1 style="font-weight:400">A little hello is waiting.</h1><p>${user.displayName.replace(/[&<>"']/g, "").slice(0, 60)} would like to exchange letters with you.</p><a href="${appUrl}/connections" style="display:inline-block;margin-top:12px;padding:13px 18px;background:#62694f;color:#fff;text-decoration:none">See the request</a></div>` });
        }
      } catch (error) { console.error("Connection request email failed", error); }
    }
    revalidatePath("/connections");
    return { ok: true };
  } catch { return { ok: false, error: "Could not send the request. Please try again." }; }
}

export async function respondToConnection(id: string, accept: boolean) {
  try {
    const user = await requireAppUser();
    const connection = await Connection.findOne({ _id: id, recipientId: user.clerkId, status: "pending" });
    if (!connection) return { ok: false, error: "That request is no longer available." };
    connection.status = accept ? "accepted" : "rejected";
    if (accept) connection.acceptedAt = new Date();
    await connection.save();
    revalidatePath("/connections"); revalidatePath("/mailbox");
    return { ok: true };
  } catch { return { ok: false, error: "Could not update that request." }; }
}

export async function removeConnection(id: string) {
  try {
    const user = await requireAppUser();
    const connection = await Connection.findOneAndUpdate({ _id: id, participants: user.clerkId, status: "accepted" }, { $set: { status: "removed" } });
    if (!connection) return { ok: false, error: "Connection not found." };
    revalidatePath("/connections"); return { ok: true };
  } catch { return { ok: false, error: "Could not remove that connection." }; }
}

export async function sendLetter(input: unknown) {
  const parsed = letterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "Check the letter details." };
  try {
    const sender = await requireAppUser();
    if (!await consumeRateLimit(sender.clerkId, "dispatch-letter", 20, 60 * 60 * 1000)) return { ok: false, error: "You’ve sent many letters this hour. Please try again later." };
    const data = parsed.data;
    const connection = await Connection.findOne({ participants: { $all: [sender.clerkId, data.recipientId] }, status: "accepted" }).lean();
    if (!connection || data.recipientId === sender.clerkId) return { ok: false, error: "Letters can only go to an accepted connection." };
    const publicIds = data.photos.map(p => p.publicId);
    if (publicIds.length) {
      const cloudinary = await import("cloudinary");
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME, apiKey = process.env.CLOUDINARY_API_KEY, apiSecret = process.env.CLOUDINARY_API_SECRET;
      if (!cloudName || !apiKey || !apiSecret) return { ok: false, error: "Photo uploads are not configured." };
      cloudinary.v2.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      for (const publicId of publicIds) {
        const asset = await cloudinary.v2.api.resource(publicId, { type: "authenticated", context: true });
        if (asset.context?.custom?.ownerId !== sender.clerkId) return { ok: false, error: "An attachment does not belong to your account." };
      }
    }
    const delayDays = deliveryDelayDays();
    const sentAt = new Date();
    const deliverAt = new Date(sentAt.getTime() + delayDays * 24 * 60 * 60 * 1000);
    const conversationId = [sender.clerkId, data.recipientId].sort().join(":");
    await Letter.create({ ...data, senderId: sender.clerkId, connectionId: connection._id, delayDays, sentAt, deliverAt, status: "scheduled", conversationId, photos: data.photos.map((photo: { publicId: string; format?: string; width?: number; height?: number; bytes: number }) => ({ publicId: photo.publicId, format: photo.format, width: photo.width, height: photo.height, bytes: photo.bytes })) });
    revalidatePath("/mailbox"); revalidatePath("/outbox");
    return { ok: true, delayDays, deliverAt: deliverAt.toISOString() };
  } catch (error) {
    console.error("sendLetter failed", error);
    return { ok: false, error: "Your letter could not be sent. Please try again." };
  }
}

export async function openLetter(id: string) {
  try {
    const user = await requireAppUser();
    await deliverDueLetters();
    const letter = await Letter.findOne({ _id: id, recipientId: user.clerkId, status: "delivered" });
    if (!letter) return { ok: false, error: "This letter has not arrived yet." };
    if (!letter.openedAt) { letter.openedAt = new Date(); await letter.save(); }
    return { ok: true, letter: { subject: letter.subject, greeting: letter.greeting, body: letter.body, signature: letter.signature, stationery: letter.stationery, fontPreference: letter.fontPreference, ink: letter.ink, photos: letter.photos.map((p: {publicId:string}) => p.publicId), senderId: letter.senderId } };
  } catch { return { ok: false, error: "Could not open that letter." }; }
}

export async function setLetterFavorite(id: string, favorite: boolean) {
  try {
    const user = await requireAppUser();
    const update = favorite ? { $addToSet: { favoriteBy: user.clerkId } } : { $pull: { favoriteBy: user.clerkId } };
    const result = await Letter.updateOne({ _id: id, recipientId: user.clerkId, status: "delivered" }, update);
    return result.modifiedCount === 1 || result.matchedCount === 1 ? { ok: true } : { ok: false, error: "Letter not found." };
  } catch { return { ok: false, error: "Could not update this letter." }; }
}

export async function setLetterReaction(id: string, emoji: string) {
  if (!["♥", "☺", "✿", "☀"].includes(emoji)) return { ok: false, error: "Choose one of the available reactions." };
  try {
    const user = await requireAppUser();
    const result = await Letter.updateOne({ _id: id, recipientId: user.clerkId, status: "delivered" }, { $set: { reaction: { emoji, by: user.clerkId } } });
    return result.matchedCount === 1 ? { ok: true } : { ok: false, error: "Letter not found." };
  } catch { return { ok: false, error: "Could not add a reaction." }; }
}

export async function fallbackDelivery() {
  const { userId } = await auth();
  if (!userId) return;
  await connectDB();
  await deliverDueLetters();
}
