import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ fileName: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { fileName } = await params;
  const safeName = path.basename(fileName);
  const filePath = path.join(process.cwd(), "storage", "uploads", "avatars", safeName);

  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(safeName).slice(1) || "png";
    return new Response(file, {
      headers: {
        "Content-Type": `image/${extension}`,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }
}
