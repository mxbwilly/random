import "server-only";
import { env } from "@/lib/env";
import { localStorage } from "./local";
import { supabaseStorage } from "./supabase";
import type { Storage } from "./types";

export const storage: Storage = env.supabaseUrl && env.supabaseServiceRoleKey ? supabaseStorage : localStorage;
export type { UploadTarget, Download } from "./types";
