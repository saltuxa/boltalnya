import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { ensureDatabase } from "@/db/init";
import { users } from "@/db/schema";
import { createId } from "@/lib/ids";
import { hashPassword } from "@/lib/passwords";
import { registerSchema } from "@/lib/validation";

ensureDatabase();

export async function POST(request: Request) {
  const payload = registerSchema.parse(await request.json());
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
