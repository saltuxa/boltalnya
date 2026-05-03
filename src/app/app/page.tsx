import { redirect } from "next/navigation";
import { MessengerShell } from "@/components/messenger/messenger-shell";
import { listChats } from "@/db/queries";
import { getCurrentUser } from "@/lib/session";

export default async function AppPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const chats = await listChats(user.id);

  return <MessengerShell currentUser={user} initialChats={chats} />;
}
