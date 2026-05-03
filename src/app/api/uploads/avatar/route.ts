import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createId } from "@/lib/ids";
import { requireUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();
  const file = form.get("avatar");

  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Нужен файл изображения" }, { status: 400 });
  }

  const extension = file.type.split("/")[1] ?? "png";
  const fileName = `${createId("ava")}.${extension}`;
  const uploadDir = path.join(process.cwd(), "storage", "uploads", "avatars");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

  const url = `/api/uploads/avatar/${fileName}`;
  await db.update(users).set({ avatar: url, updatedAt: new Date() }).where(eq(users.id, user.id));

  return NextResponse.json({ url });
}
