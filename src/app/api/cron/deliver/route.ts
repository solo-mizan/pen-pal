import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { deliverDueLetters, sendWritingReminders } from "@/lib/delivery";

export async function GET(request: Request) {
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken) {
    return NextResponse.json({ error: "Server configuration error: CRON_SECRET is missing." }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
  }

  try {
    await connectDB();
    const delivered = await deliverDueLetters();
    const reminders = await sendWritingReminders();
    return NextResponse.json({ success: true, delivered, reminders, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Cron delivery failed:", error);
    return NextResponse.json({ error: "Delivery processing failed." }, { status: 503 });
  }
}
