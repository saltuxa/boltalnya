import { NextResponse } from "next/server";
import { createMessage, listMessages } from "@/db/queries";
import { requireUser } from "@/lib/session";
import { messageCreateSchema } from "@/lib/validation";

type Params = {
  params: Promise<{ chatId: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const user = await requireUser();
  const { chatId } = await params;
  const { searchParams } = new URL(request.url);
  const messages = await listMessages(chatId, user.id, searchParams.get("q") ?? "");
  return NextResponse.json({ messages });
}

export async function POST(request: Request, { params }: Params) {
  const user = await requireUser();
  const { chatId } = await params;
  const payload = messageCreateSchema.parse(await request.json());
  const message = await createMessage({
    chatId,
    authorId: user.id,
    body: payload.body,
    replyToId: payload.replyToId
  });
  return NextResponse.json({ message }, { status: 201 });
}
