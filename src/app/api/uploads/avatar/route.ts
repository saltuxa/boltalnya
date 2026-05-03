import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/session";

const MAX_AVATAR_BYTES = 512 * 1024;

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();
  const file = form.get("avatar");

  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Нужен файл изображения" }, { status: 400 });
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "Аватар должен быть не больше 512 KB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  await db.update(users).set({ avatar: dataUrl, updatedAt: new Date() }).where(eq(users.id, user.id));

  return NextResponse.json({ url: dataUrl });
}
