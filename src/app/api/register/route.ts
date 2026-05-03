import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/db/client";
import { ensureDatabase } from "@/db/init";
import { users } from "@/db/schema";
import { createId } from "@/lib/ids";
import { hashPassword } from "@/lib/passwords";
import { registerSchema } from "@/lib/validation";

ensureDatabase();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: formatRegisterError(parsed.error) }, { status: 400 });
  }

  const payload = parsed.data;
  const username = payload.username.toLowerCase();

  const existing = await db.query.users.findFirst({
    where: eq(users.username, username)
  });

  if (existing) {
    return NextResponse.json({ error: "Такой логин уже занят" }, { status: 409 });
  }

  const id = createId("usr");
  await db.insert(users).values({
    id,
    twitchId: null,
    name: payload.name,
    username,
    email: null,
    passwordHash: hashPassword(payload.password)
  });

  return NextResponse.json(
    {
      user: {
        id,
        name: payload.name,
        username
      }
    },
    { status: 201 }
  );
}

function formatRegisterError(error: ZodError) {
  const first = error.issues[0];
  if (!first) return "Проверьте данные регистрации";

  const field = first.path[0];
  if (field === "name") return "Имя должно быть от 2 до 60 символов";
  if (field === "username") return "Логин должен быть от 3 до 32 символов: буквы, цифры, _ или -";
  if (field === "password") return "Пароль должен быть минимум 4 символа";
  return "Проверьте данные регистрации";
}
