import { currentUser } from "@clerk/nextjs/server";

export const ADMIN_EMAIL = "muhammad.mizan.cs@gmail.com";

export function isAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}

export async function isSiteAdmin() {
  const clerk = await currentUser();
  if (!clerk) return false;
  const primaryEmail = clerk.emailAddresses.find((entry) => entry.id === clerk.primaryEmailAddressId);
  return Boolean(primaryEmail?.verification?.status === "verified" && isAdminEmail(primaryEmail.emailAddress));
}
