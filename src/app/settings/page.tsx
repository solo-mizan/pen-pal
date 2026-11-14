import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { requireAppUser } from "@/lib/auth";
import { clerkConfigured } from "@/lib/config";
import SettingsForm from "@/components/settings-form";
export const dynamic="force-dynamic";
export default async function SettingsPage(){if(!clerkConfigured)redirect("/sign-in");const {userId}=await auth();if(!userId)redirect("/sign-in");await connectDB();const user=await requireAppUser();const defaultTimezone=!user.timezone||user.timezone==="UTC"?"Asia/Dhaka":user.timezone;return <main className="settings-page"><header><Link className="brand" href="/mailbox"><span className="brand-mark">✉</span> dear, <i>letter</i></Link><Link href="/mailbox" className="text-link">← Mailbox</Link></header><section className="settings-content"><div className="eyebrow"><span/> YOUR LITTLE CORNER</div><h1>Account & preferences</h1><p>Make this mailbox feel like it belongs to you.</p><SettingsForm initial={{displayName:user.displayName,username:user.username,preferredLanguage:user.preferredLanguage||"en",timezone:defaultTimezone,profileVisible:user.profileVisible,emailLetters:user.notifications?.emailLetters??true,emailConnections:user.notifications?.emailConnections??true,writingReminders:user.notifications?.writingReminders??false}}/></section></main>}
