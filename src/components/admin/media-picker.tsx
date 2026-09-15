"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Film, ImageOff, X } from "lucide-react";
import type { MediaPreview } from "@/lib/admin/queries";
import { buttonClass } from "./primitives";

/**
 * Picks a Media row by id. Renders a hidden input `name` with the chosen id and
 * a thumbnail; the modal lists media from GET /api/admin/media (server-checked).
 */
export function MediaPicker({ name, value, preview, kinds = ["IMAGE"], disabled, inputId }: { name: string; value: string; preview?: MediaPreview | null; kinds?: readonly string[]; disabled?: boolean; inputId?: string }) {
  const [current, setCurrent] = useState<MediaPreview | null>(preview ?? null);
  const [id, setId] = useState(value);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-start gap-3">
      <input type="hidden" name={name} value={id} id={inputId} />
      <Thumb item={current} className="size-20" />
      <div className="flex flex-col gap-1.5">
        {current ? <p className="max-w-[16rem] truncate font-mono text-xs text-fg-muted">{current.filename}</p> : <p className="text-sm text-fg-subtle">No file selected</p>}
        <div className="flex gap-2">
          <button type="button" disabled={disabled} onClick={() => setOpen(true)} className={buttonClass("secondary", "sm")}>
            {current ? "Change" : "Choose from library"}
          </button>
          {current ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setCurrent(null);
                setId("");
              }}
              className={buttonClass("ghost", "sm")}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {open ? (
        <MediaDialog
          kinds={kinds}
          onClose={() => setOpen(false)}
          onPick={(item) => {
            setCurrent(item);
            setId(item.id);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

export function Thumb({ item, className = "size-16" }: { item: MediaPreview | null; className?: string }) {
  const frame = `${className} shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-line bg-bg-hover flex items-center justify-center text-fg-subtle`;
  if (!item) return <div className={frame} aria-hidden><ImageOff className="size-5" strokeWidth={1.5} /></div>;
  if (item.kind === "IMAGE" || item.kind === "LOGO") {
    // eslint-disable-next-line @next/next/no-img-element -- uploads are local files of unknown dimensions
    return <img src={item.url} alt={item.alt || ""} className={`${frame} object-cover`} />;
  }
  return (
    <div className={frame} aria-label={item.kind}>
      {item.kind === "VIDEO" ? <Film className="size-5" strokeWidth={1.5} aria-hidden /> : <FileText className="size-5" strokeWidth={1.5} aria-hidden />}
    </div>
  );
}

function MediaDialog({ kinds, onClose, onPick }: { kinds: readonly string[]; onClose: () => void; onPick: (item: MediaPreview) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const kindsKey = kinds.join(",");

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q, kinds: kindsKey });
        const res = await fetch(`/api/admin/media?${params}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { items: MediaPreview[] };
        setItems(json.items);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) setError("Could not load the media library.");
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [q, kindsKey]);

  return (
    <dialog ref={ref} onClose={onClose} className="theme-light m-auto w-[min(56rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-line bg-bg-raised p-0 text-fg shadow-lg backdrop:bg-ink/40" aria-labelledby="media-dialog-title">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 id="media-dialog-title" className="font-display text-2xl leading-none">
          Media library
        </h2>
        <button type="button" onClick={onClose} className="rounded p-1.5 text-fg-subtle hover:text-fg" aria-label="Close">
          <X className="size-4" strokeWidth={1.5} aria-hidden />
        </button>
      </div>
      <div className="px-5 py-3">
        <label htmlFor="media-search" className="sr-only">
          Search media
        </label>
        <input id="media-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by filename, alt text or tag" className="h-10 w-full rounded-[var(--radius-sm)] border border-line-strong bg-transparent px-3 text-sm text-fg focus:border-fg focus:outline-none" autoFocus />
        <p className="mt-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">Showing: {kinds.join(", ").toLowerCase()}</p>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-5 pb-5">
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        {loading && items.length === 0 ? <p className="text-sm text-fg-muted">Loading…</p> : null}
        {!loading && items.length === 0 && !error ? <p className="text-sm text-fg-muted">No media found. Upload files in the Media library first.</p> : null}
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => onPick(item)} className="group flex w-full flex-col gap-1.5 rounded-[var(--radius-sm)] p-1 text-left hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-ring/60">
                <Thumb item={item} className="aspect-square w-full" />
                <span className="w-full truncate font-mono text-[0.6875rem] text-fg-muted">{item.filename}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
