import { getNavigation } from "@/lib/content";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const [header, audience] = await Promise.all([getNavigation("HEADER"), getNavigation("AUDIENCE")]);
  return <HeaderNav items={header.map(({ id, label, href, description }) => ({ id, label, href, description }))} audience={audience.map(({ id, label, href, description }) => ({ id, label, href, description }))} />;
}
