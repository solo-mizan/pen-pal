import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { parsePushSubscription } from "@/lib/push-subscription";
import { PushSubscription } from "@/models";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to enable notifications." }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request could not be verified." }, { status: 403 });

  const subscription = parsePushSubscription(await request.json().catch(() => null));
  if (!subscription) {
    return NextResponse.json({ error: "This browser subscription is not valid." }, { status: 400 });
  }

  try {
    await connectDB();
    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint }).select("userId").lean();
    if (existing && existing.userId !== userId) {
      return NextResponse.json({ error: "This device is linked to another mailbox. Turn notifications off there first." }, { status: 409 });
    }
    await PushSubscription.updateOne(
      { endpoint: subscription.endpoint, userId },
      { $set: { keys: subscription.keys }, $setOnInsert: { endpoint: subscription.endpoint, userId } },
      { upsert: true, runValidators: true },
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save notifications for this device." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to manage notifications." }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request could not be verified." }, { status: 403 });

  const parsed = z.object({ endpoint: z.string().url().max(2048) }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "This browser subscription is not valid." }, { status: 400 });
  try {
    await connectDB();
    await PushSubscription.deleteOne({ userId, endpoint: parsed.data.endpoint });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not turn notifications off on this device." }, { status: 500 });
  }
}
