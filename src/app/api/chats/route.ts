import { NextResponse } from "next/server";
import { createChat, listChats } from "@/db/queries";
import { requireUser } from "@/lib/session";
import { chatCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const chats = await listChats(user.id, searchParams.get("q") ?? "");
  return NextResponse.json({ chats });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const payload = chatCreateSchema.parse(await request.json());
  const id = await createChat({
    title: payload.title,
    type: payload.type,
    ownerId: user.id,
    memberIds: payload.memberIds
  });
  const chats = await listChats(user.id);
  return NextResponse.json({ id, chats }, { status: 201 });
}
