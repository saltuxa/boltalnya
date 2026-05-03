import { NextResponse } from "next/server";
import { addChatMembers, listChatMembers } from "@/db/queries";
import { requireUser } from "@/lib/session";
import { chatMembersAddSchema } from "@/lib/validation";

type Params = {
  params: Promise<{ chatId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const user = await requireUser();
  const { chatId } = await params;
  const members = await listChatMembers(chatId, user.id);
  return NextResponse.json({ members });
}

export async function POST(request: Request, { params }: Params) {
  const user = await requireUser();
  const { chatId } = await params;
  const payload = chatMembersAddSchema.parse(await request.json());

  try {
    const members = await addChatMembers(chatId, user.id, payload.userIds);
    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось добавить участников" },
      { status: 400 }
    );
  }
}
