import { getNavigation } from "@/lib/content";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const [header, audience] = await Promise.all([getNavigation("HEADER"), getNavigation("AUDIENCE")]);
  return (
    <>
      {/* Taps on the phone menu or search button before the page's JavaScript has loaded (slow connections) would be
          lost. This runs as soon as the HTML arrives, remembers the intent, and HeaderNav acts on it once ready. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){document.addEventListener("click",function(e){if(window.__shvNavReady)return;var t=e.target&&e.target.closest?e.target.closest('[aria-controls="mobile-menu"],[aria-label="Search the site"]'):null;if(!t)return;window.__shvPending=t.getAttribute("aria-controls")==="mobile-menu"?"menu":"search";},true);})();`,
        }}
      />
      <HeaderNav items={header.map(({ id, label, href, description }) => ({ id, label, href, description }))} audience={audience.map(({ id, label, href, description }) => ({ id, label, href, description }))} />
    </>
  );
}
