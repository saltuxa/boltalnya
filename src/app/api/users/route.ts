import { NextResponse } from "next/server";
import { searchUsers } from "@/db/queries";
import { requireUser } from "@/lib/session";
import { userSearchSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const parsed = userSearchSchema.safeParse({ q: searchParams.get("q") ?? "" });

  if (!parsed.success) {
    return NextResponse.json({ users: [] });
  }

  const results = await searchUsers(user.id, parsed.data.q);
  return NextResponse.json({ users: results });
}
