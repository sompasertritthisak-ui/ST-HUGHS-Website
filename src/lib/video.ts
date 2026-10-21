/** Recognise the video links editors paste into the CMS (YouTube, Vimeo, an uploaded file) so pages can play them inline. */
export type ParsedVideo =
  | { kind: "youtube"; id: string; embed: string; thumb: string }
  | { kind: "vimeo"; id: string; embed: string }
  | { kind: "file"; src: string }
  | { kind: "link"; href: string };

export function parseVideo(url: string | null | undefined): ParsedVideo | null {
  const raw = url?.trim();
  if (!raw) return null;
  if (/^\/[^/]/.test(raw) && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(raw)) return { kind: "file", src: raw };
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let yt: string | null = null;
  if (host === "youtu.be") yt = u.pathname.slice(1).split("/")[0] || null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    yt = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null;
  }
  if (yt && /^[\w-]{6,15}$/.test(yt)) {
    return { kind: "youtube", id: yt, embed: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`, thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(\d{6,})/)?.[1];
    if (id) return { kind: "vimeo", id, embed: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1` };
  }
  if (/\.(mp4|webm|mov|m4v)$/i.test(u.pathname)) return { kind: "file", src: u.toString() };
  return { kind: "link", href: u.toString() };
}
