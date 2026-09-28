import "server-only";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { env } from "@/lib/env";
import type { Storage } from "./types";

function client() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, { auth: { persistSession: false } });
}

/** Supabase Storage (private bucket). Uploads go browser -> Supabase via signed upload URLs. */
export const supabaseStorage: Storage = {
  async createUploadTarget(p, mimeType) {
    const { data, error } = await client().storage.from(env.supabaseBucket).createSignedUploadUrl(p);
    if (error || !data) throw new Error(`Could not create upload URL: ${error?.message}`);
    return { mode: "direct", url: data.signedUrl, headers: { "content-type": mimeType, "x-upsert": "false" } };
  },

  async putObject() {
    throw new Error("Direct uploads are used with Supabase; putObject is not supported.");
  },

  async stat(p) {
    const { data, error } = await client()
      .storage.from(env.supabaseBucket)
      .list(path.posix.dirname(p), { search: path.posix.basename(p), limit: 1 });
    if (error) return null;
    const hit = data?.find((o) => o.name === path.posix.basename(p));
    if (!hit) return null;
    return { size: Number((hit.metadata as { size?: number } | null)?.size ?? 0) };
  },

  async getDownload(p, { filename, inline }) {
    const { data, error } = await client()
      .storage.from(env.supabaseBucket)
      .createSignedUrl(p, 300, inline ? undefined : { download: filename });
    if (error || !data) throw new Error(`Could not sign URL: ${error?.message}`);
    return { kind: "redirect", url: data.signedUrl };
  },

  async deleteObject(p) {
    await client().storage.from(env.supabaseBucket).remove([p]);
  },
};
