import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/db/client";
import { ensureDatabase } from "@/db/init";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { profileUpdateSchema } from "@/lib/validation";

ensureDatabase();

export async function GET() {
  const user = await requireUser();
  const profile = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  const parsed = profileUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatProfileError(parsed.error) }, { status: 400 });
  }
  const payload = parsed.data;

  try {
    await db
      .update(users)
      .set({
        name: payload.name,
        username: payload.username.toLowerCase(),
        status: payload.status,
        theme: payload.theme,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
  } catch {
    return NextResponse.json({ error: "Такой логин уже занят" }, { status: 409 });
  }

  const profile = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  return NextResponse.json({ profile });
}

function formatProfileError(error: ZodError) {
  const field = error.issues[0]?.path[0];
  if (field === "name") return "Имя должно быть от 2 до 60 символов";
  if (field === "username") return "Логин должен быть от 3 до 32 символов: буквы, цифры, _ или -";
  if (field === "status") return "Статус должен быть не длиннее 120 символов";
  return "Проверьте данные профиля";
}
