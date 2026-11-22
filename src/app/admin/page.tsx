import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { clerkConfigured } from "@/lib/config";
import { isSiteAdmin } from "@/lib/admin";
import { getDeliverySettings } from "@/lib/delivery-settings";
import { Connection, Letter, User } from "@/models";
import AdminPanel from "@/components/admin-panel";
import SiteHeader from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!clerkConfigured) redirect("/sign-in");
  if (!await isSiteAdmin()) notFound();
  await connectDB();

  const now = new Date();
  const [settings, users, scheduled, overdue, delivered, pendingConnections] = await Promise.all([
    getDeliverySettings(),
    User.countDocuments(),
    Letter.countDocuments({ status: "scheduled" }),
    Letter.countDocuments({ status: "scheduled", deliverAt: { $lte: now } }),
    Letter.countDocuments({ status: "delivered" }),
    Connection.countDocuments({ status: "pending" }),
  ]);

  return <><SiteHeader /><main className="admin-page">
    <section className="admin-content">
      <div className="eyebrow"><span/> PRIVATE ADMINISTRATION</div>
      <h1>Keep the post moving.</h1>
      <p>Manage delivery timing for everyone and check the health of the mailbox.</p>
      <AdminPanel settings={settings} stats={{ users, scheduled, overdue, delivered, pendingConnections }} />
    </section>
  </main></>;
}
