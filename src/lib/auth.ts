import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { profileUsernameBase, usernameAttempt } from "@/lib/domain";

export async function requireAppUser() {
  const clerk = await currentUser();
  if (!clerk) throw new Error("Sign in to continue.");
  const email = clerk.emailAddresses.find((entry) => entry.id === clerk.primaryEmailAddressId)?.emailAddress || clerk.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("Your account needs an email address.");
  await connectDB();
  let user = await User.findOne({ clerkId: clerk.id });
  if (!user) {
    const base = profileUsernameBase(clerk.username, clerk.firstName);
    const profile = { clerkId: clerk.id, displayName: [clerk.firstName, clerk.lastName].filter(Boolean).join(" ") || "Letter friend", email, imageUrl: clerk.imageUrl };
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const username = usernameAttempt(base, clerk.id, attempt);
      try {
        user = await User.create({ ...profile, username });
        break;
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        user = await User.findOne({ clerkId: clerk.id });
        if (user) break;
      }
    }
    if (!user) throw new Error("Could not reserve a unique username for the new profile.");
  }
  return user;
}
