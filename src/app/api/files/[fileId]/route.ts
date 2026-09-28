import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { storage } from "@/lib/storage";

/**
 * Serves an exam file to a verified student of the same school.
 * ?dl=1 forces a download (and counts it); otherwise the file is shown inline.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/files/[fileId]">) {
  const user = await getCurrentUser();
  if (!user?.emailVerifiedAt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId } = await params;
  const file = await db.examFile.findUnique({ where: { id: fileId }, include: { exam: true } });
  if (!file || file.exam.schoolId !== user.schoolId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const canSeeHidden = file.exam.uploaderId === user.id || user.role === "ADMIN";
  if (file.exam.status !== "LIVE" && !canSeeHidden) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const download = request.nextUrl.searchParams.get("dl") === "1";
  if (download) await db.exam.update({ where: { id: file.examId }, data: { downloadCount: { increment: 1 } } });

  const result = await storage.getDownload(file.storagePath, { filename: file.originalName, mimeType: file.mimeType, inline: !download });
  if (result.kind === "redirect") return NextResponse.redirect(result.url, 302);

  const disposition = `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.originalName)}`;
  return new Response(result.stream, {
    headers: {
      "content-type": result.mimeType,
      "content-length": String(result.size),
      "content-disposition": disposition,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
