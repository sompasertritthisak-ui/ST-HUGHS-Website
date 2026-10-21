/**
 * Page scroll lock for overlays (menu drawer, search). `overflow: hidden` on <body> is ignored by iOS Safari, so the
 * body is pinned with `position: fixed` at the current offset and restored on unlock. Reference-counted so two
 * overlays never fight, and broadcasts `shv:scroll-lock` so the desktop smooth scroller (Lenis) pauses too.
 */
let locks = 0;
let savedY = 0;
let saved: Partial<CSSStyleDeclaration> = {};

export const SCROLL_LOCK_EVENT = "shv:scroll-lock";

export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  if (locks++ === 0) {
    const { body, documentElement } = document;
    savedY = window.scrollY;
    saved = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width, overflow: body.style.overflow };
    const gap = window.innerWidth - documentElement.clientWidth;
    body.style.position = "fixed";
    body.style.top = `-${savedY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    window.dispatchEvent(new CustomEvent(SCROLL_LOCK_EVENT, { detail: true }));
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks > 0) return;
    const { body } = document;
    Object.assign(body.style, saved);
    body.style.paddingRight = "";
    // Restore instantly: the global `scroll-behavior: smooth` would otherwise animate back from the top.
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, savedY);
    html.style.scrollBehavior = prev;
    window.dispatchEvent(new CustomEvent(SCROLL_LOCK_EVENT, { detail: false }));
  };
}
