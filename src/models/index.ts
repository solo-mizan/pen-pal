import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { MAX_LETTER_BODY_CHARACTERS } from "@/lib/letter-limits";

const userSchema = new Schema({
  clerkId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 24 },
  displayName: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, lowercase: true, trim: true },
  imageUrl: { type: String, default: "" },
  preferredLanguage: { type: String, enum: ["en", "bn"], default: "en" },
  timezone: { type: String, default: "Asia/Dhaka" },
  lastWritingReminderAt: Date,
  profileVisible: { type: Boolean, default: true },
}, { timestamps: true });

const connectionSchema = new Schema({
  participants: { type: [String], required: true, validate: (v: string[]) => v.length === 2 && v[0] !== v[1] },
  pairKey: { type: String, required: true, unique: true },
  requesterId: { type: String, required: true },
  recipientId: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected", "removed"], default: "pending", index: true },
  inviteCode: { type: String, unique: true, sparse: true },
  acceptedAt: Date,
}, { timestamps: true });
connectionSchema.index({ participants: 1, status: 1 });
connectionSchema.index({ recipientId: 1, status: 1, createdAt: -1 });

const photoSchema = new Schema({ publicId: { type: String, required: true }, format: String, width: Number, height: Number, bytes: Number, secureUrl: String }, { _id: false });
const letterSchema = new Schema({
  senderId: { type: String, required: true, index: true }, recipientId: { type: String, required: true, index: true },
  connectionId: { type: Schema.Types.ObjectId, ref: "Connection", required: true, index: true },
  subject: { type: String, maxlength: 100, default: "" }, greeting: { type: String, maxlength: 120, default: "" },
  body: { type: String, required: true, maxlength: MAX_LETTER_BODY_CHARACTERS }, signature: { type: String, maxlength: 120, default: "" },
  stationery: { type: String, enum: ["cream", "vintage", "pastel", "white", "blue"], default: "cream" },
  fontPreference: { type: String, enum: ["caveat", "atma", "serif"], default: "caveat" },
  ink: { type: String, enum: ["brown", "sage", "blue", "rose"], default: "brown" },
  photos: { type: [photoSchema], default: [], validate: (v: unknown[]) => v.length <= 5 },
  status: { type: String, enum: ["draft", "scheduled", "delivered"], default: "draft", index: true },
  delayDays: { type: Number, min: 0, max: 30 }, sentAt: Date, deliverAt: Date, deliveredAt: Date, openedAt: Date,
  pushNotificationPendingAt: Date, pushNotifiedAt: Date, pushNotificationClaimedAt: Date, pushNotificationClaimId: String,
  favoriteBy: { type: [String], default: [] },
  conversationId: { type: String, index: true }, parentLetterId: { type: Schema.Types.ObjectId, ref: "Letter" },
}, { timestamps: true });
letterSchema.index({ recipientId: 1, status: 1, deliverAt: 1 });
letterSchema.index({ status: 1, deliverAt: 1 });
letterSchema.index({ senderId: 1, sentAt: -1 });
letterSchema.index({ conversationId: 1, sentAt: 1 });

const notificationSchema = new Schema({
  userId: { type: String, required: true, index: true }, type: { type: String, enum: ["connection_request", "letter_arrived", "letter_opened"], required: true },
  relatedId: { type: String, required: true }, message: { type: String, required: true, maxlength: 180 }, readAt: Date,
}, { timestamps: true });
notificationSchema.index({ userId: 1, createdAt: -1 });

const rateLimitSchema = new Schema({ _id: String, count: { type: Number, required: true }, expiresAt: { type: Date, required: true } }, { versionKey: false });
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const appSettingsSchema = new Schema({
  _id: { type: String, default: "global" },
  deliveryMode: { type: String, enum: ["random", "instant"], default: "random" },
  deliveryMinDays: { type: Number, min: 0, max: 30, default: 2 },
  deliveryMaxDays: { type: Number, min: 0, max: 30, default: 3 },
}, { timestamps: true, versionKey: false });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
export const Connection = mongoose.models.Connection ?? mongoose.model("Connection", connectionSchema);
export const Letter = mongoose.models.Letter ?? mongoose.model("Letter", letterSchema);
export const Notification = mongoose.models.Notification ?? mongoose.model("Notification", notificationSchema);
export const RateLimit = mongoose.models.RateLimit ?? mongoose.model("RateLimit", rateLimitSchema);
export const AppSettings = mongoose.models.AppSettings ?? mongoose.model("AppSettings", appSettingsSchema);

const pushSubscriptionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: { p256dh: { type: String, required: true }, auth: { type: String, required: true } },
}, { timestamps: true });
export const PushSubscription = mongoose.models.PushSubscription ?? mongoose.model("PushSubscription", pushSubscriptionSchema);
