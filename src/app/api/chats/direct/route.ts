import { NextResponse } from "next/server";
import { findOrCreateDirectChat, listChats } from "@/db/queries";
import { requireUser } from "@/lib/session";
import { directChatSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await requireUser();
  const payload = directChatSchema.parse(await request.json());

  try {
    const id = await findOrCreateDirectChat(user.id, payload.userId);
    const chats = await listChats(user.id);
    return NextResponse.json({ id, chats }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось открыть личный чат" },
      { status: 400 }
    );
  }
}
