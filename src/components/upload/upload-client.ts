import type { UploadTarget } from "@/lib/storage/types";

/** PUTs one file to its upload target (our proxy route or object storage directly). */
export async function uploadFile(target: UploadTarget, file: File) {
  const res = await fetch(target.url, {
    method: "PUT",
    body: file,
    headers: target.mode === "direct" ? target.headers : { "content-type": file.type || "application/octet-stream" },
  });
  if (!res.ok) {
    let message = `Upload of ${file.name} failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error) message = `${file.name}: ${body.error}`;
      else if (body?.message) message = `${file.name}: ${body.message}`;
    } catch {}
    throw new Error(message);
  }
}
