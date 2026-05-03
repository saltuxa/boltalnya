import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/profile/settings-form";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const profile = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  if (!profile) redirect("/login");

  return <SettingsForm profile={profile} />;
}
