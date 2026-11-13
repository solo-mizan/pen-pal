import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models";

export async function requireAppUser() {
  const clerk = await currentUser();
  if (!clerk) throw new Error("Sign in to continue.");
  const email = clerk.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("Your account needs a verified email address.");
  await connectDB();
  let user = await User.findOne({ clerkId: clerk.id });
  if (!user) {
    const base = (clerk.username || clerk.firstName || "letterfriend").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18) || "letterfriend";
    let username = base;
    for (let suffix = 1; await User.exists({ username }); suffix += 1) username = `${base}${suffix}`;
    user = await User.create({ clerkId: clerk.id, username, displayName: [clerk.firstName, clerk.lastName].filter(Boolean).join(" ") || "Letter friend", email, imageUrl: clerk.imageUrl });
  }
  return user;
}
