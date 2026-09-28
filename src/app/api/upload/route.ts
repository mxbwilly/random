import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { storage } from "@/lib/storage";

/**
 * Proxy upload endpoint used only with local disk storage. The browser PUTs
 * the raw file body here; with Supabase configured, files never touch this server.
 */
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.emailVerifiedAt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = request.nextUrl.searchParams.get("path") ?? "";
  const file = await db.examFile.findFirst({
    where: { storagePath: path, exam: { uploaderId: user.id, status: "HIDDEN" } },
  });
  if (!file) return NextResponse.json({ error: "Unknown upload" }, { status: 404 });
  if (!request.body) return NextResponse.json({ error: "Empty body" }, { status: 400 });

  try {
    const size = await storage.putObject(path, request.body, file.mimeType, env.maxUploadBytes);
    return NextResponse.json({ ok: true, size });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: message === "File too large" ? 413 : 500 });
  }
}
