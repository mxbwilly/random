import "server-only";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Storage } from "./types";

// Fixed to ./storage so bundlers can see the scope; ignored by git.
const root = path.join(process.cwd(), "storage");

function resolveSafe(p: string) {
  const full = path.join(process.cwd(), "storage", path.normalize(p));
  if (!full.startsWith(root + path.sep) || p.includes("..")) throw new Error("Invalid storage path");
  return full;
}

/** Stores files on local disk. For development only; not suitable for Vercel. */
export const localStorage: Storage = {
  async createUploadTarget(p) {
    return { mode: "proxy", url: `/api/upload?path=${encodeURIComponent(p)}` };
  },

  async putObject(p, body, _mimeType, maxBytes) {
    const full = resolveSafe(p);
    await mkdir(path.dirname(full), { recursive: true });
    let written = 0;
    const limiter = new Writable({
      write(chunk: Buffer, _enc, cb) {
        written += chunk.length;
        if (written > maxBytes) return cb(new Error("File too large"));
        file.write(chunk, cb);
      },
      final(cb) {
        file.end(cb);
      },
    });
    const file = createWriteStream(full);
    try {
      await pipeline(Readable.fromWeb(body as import("node:stream/web").ReadableStream), limiter);
    } catch (e) {
      await unlink(full).catch(() => {});
      throw e;
    }
    return written;
  },

  async stat(p) {
    try {
      const s = await stat(resolveSafe(p));
      return { size: s.size };
    } catch {
      return null;
    }
  },

  async getDownload(p, { mimeType }) {
    const full = resolveSafe(p);
    const s = await stat(full);
    const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
    return { kind: "stream", stream, size: s.size, mimeType };
  },

  async deleteObject(p) {
    await unlink(resolveSafe(p)).catch(() => {});
  },
};
