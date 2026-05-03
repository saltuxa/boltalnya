import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
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
  const payload = profileUpdateSchema.parse(await request.json());

  await db
    .update(users)
    .set({
      name: payload.name,
      username: payload.username,
      status: payload.status,
      theme: payload.theme,
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id));

  const profile = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  return NextResponse.json({ profile });
}
