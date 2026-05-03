import { NextResponse } from "next/server";
import { deleteMessage, updateMessage } from "@/db/queries";
import { requireUser } from "@/lib/session";
import { messageUpdateSchema } from "@/lib/validation";

type Params = {
  params: Promise<{ messageId: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const user = await requireUser();
  const { messageId } = await params;
  const payload = messageUpdateSchema.parse(await request.json());
  const message = await updateMessage(messageId, user.id, payload.body);

  if (!message) {
    return NextResponse.json({ error: "Сообщение не найдено или нет прав" }, { status: 404 });
  }

  return NextResponse.json({ message });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await requireUser();
  const { messageId } = await params;
  const deleted = await deleteMessage(messageId, user.id);

  if (!deleted) {
    return NextResponse.json({ error: "Сообщение не найдено или нет прав" }, { status: 404 });
  }

  return NextResponse.json({ message: deleted });
}
