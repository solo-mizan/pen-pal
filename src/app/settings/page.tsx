import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { requireAppUser } from "@/lib/auth";
import { clerkConfigured } from "@/lib/config";
import SettingsForm from "@/components/settings-form";
import PushControl from "@/components/push-control";
import SiteHeader from "@/components/site-header";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  if (!clerkConfigured) redirect("/sign-in");
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  await connectDB();
  const user = await requireAppUser();
  const timezone = !user.timezone || user.timezone === "UTC" ? "Asia/Dhaka" : user.timezone;
  return <><SiteHeader /><main className="settings-page"><section className="settings-content">
    <div className="eyebrow"><span /> YOUR LITTLE CORNER</div><h1>Account & preferences</h1><p>Make this mailbox feel like it belongs to you.</p>
    <SettingsForm initial={{ displayName: user.displayName, username: user.username, preferredLanguage: user.preferredLanguage || "en", timezone, profileVisible: user.profileVisible }} />
    <div className="settings-group push-settings-group"><span className="section-kicker">A QUIET NOTE WHEN IT ARRIVES</span><PushControl userId={userId} placement="settings" /></div>
  </section></main></>;
}
