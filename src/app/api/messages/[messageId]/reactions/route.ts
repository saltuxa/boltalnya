import { NextResponse } from "next/server";
import { toggleReaction } from "@/db/queries";
import { requireUser } from "@/lib/session";
import { reactionToggleSchema } from "@/lib/validation";

type Params = {
  params: Promise<{ messageId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const user = await requireUser();
  const { messageId } = await params;
  const payload = reactionToggleSchema.parse(await request.json());
  const message = await toggleReaction(messageId, user.id, payload.emoji);

  if (!message) {
    return NextResponse.json({ error: "Сообщение не найдено или нет прав" }, { status: 404 });
  }

  return NextResponse.json({ message });
}
