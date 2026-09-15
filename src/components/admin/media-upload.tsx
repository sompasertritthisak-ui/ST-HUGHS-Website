"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { buttonClass } from "./primitives";
import { useToast } from "./toast";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,video/mp4,application/pdf";

export function MediaUpload() {
  const router = useRouter();
  const { push } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    let ok = 0;
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.set("file", file);
      try {
        const res = await fetch("/api/admin/media", { method: "POST", body });
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
        ok += 1;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    if (ok) {
      push(`${ok} file${ok === 1 ? "" : "s"} uploaded.`);
      router.refresh();
    }
  }

  return (
    <div
      className="rounded-[var(--radius)] border border-dashed border-line-strong bg-bg-raised p-5 text-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void upload(e.dataTransfer.files);
      }}
    >
      <Upload className="mx-auto size-5 text-fg-subtle" strokeWidth={1.5} aria-hidden />
      <p className="mt-2 text-sm text-fg-muted">Drop files here or</p>
      <label className={`${buttonClass("secondary", "sm")} mt-2 cursor-pointer`}>
        {busy ? "Uploading…" : "Choose files"}
        <input ref={input} type="file" accept={ACCEPT} multiple disabled={busy} onChange={(e) => void upload(e.target.files)} className="sr-only" />
      </label>
      <p className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">JPEG, PNG, WebP, AVIF, MP4, PDF · max 25 MB</p>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
