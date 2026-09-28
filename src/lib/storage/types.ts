export type UploadTarget =
  | { mode: "direct"; url: string; headers: Record<string, string> } // browser PUTs straight to object storage
  | { mode: "proxy"; url: string }; // browser PUTs to our own /api/upload (local dev)

export type Download =
  | { kind: "redirect"; url: string }
  | { kind: "stream"; stream: ReadableStream; size: number; mimeType: string };

export interface Storage {
  createUploadTarget(path: string, mimeType: string): Promise<UploadTarget>;
  /** Only used in proxy mode. */
  putObject(path: string, body: ReadableStream<Uint8Array>, mimeType: string, maxBytes: number): Promise<number>;
  stat(path: string): Promise<{ size: number } | null>;
  getDownload(path: string, opts: { filename: string; mimeType: string; inline: boolean }): Promise<Download>;
  deleteObject(path: string): Promise<void>;
}
