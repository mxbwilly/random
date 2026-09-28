/** Shared between the upload UI and the server: what files we accept. */
export const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
};
export const ACCEPT_ATTR = Object.keys(ALLOWED_TYPES).join(",") + ",.pdf,.png,.jpg,.jpeg,.webp,.heic";
export const MAX_EXAM_FILES = 5;
export const MAX_SOLUTION_FILES = 3;

export function extensionFor(mimeType: string, originalName: string) {
  const known = ALLOWED_TYPES[mimeType];
  if (known) return known;
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
  return Object.values(ALLOWED_TYPES).includes(ext) ? ext : null;
}

export const CURRENT_YEAR = new Date().getFullYear();
export const MIN_YEAR = 1990;
