import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Sans_Lao_Looped, Noto_Serif_Lao, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DeployGuard } from "@/components/site/deploy-guard";

/* Typography
 * Display: Cormorant Garamond (headings). Text and labels: Plus Jakarta Sans, a clean modern sans that replaced
 * IBM Plex Sans/Mono after staff feedback that the labels read as blocky.
 * Lao: Noto Sans Lao Looped (the looped letterforms Lao readers learn, most legible for body text) and Noto Serif Lao
 * beside the serif headings. Lao faces are not preloaded and carry a Lao-only unicode-range, so English visitors never
 * download them; they load the moment Lao text appears (e.g. after choosing ລາວ in the language menu). */
const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
});

const lao = Noto_Sans_Lao_Looped({
  variable: "--font-lao",
  subsets: ["lao"],
  display: "swap",
  preload: false,
});

const laoSerif = Noto_Serif_Lao({
  variable: "--font-lao-serif",
  subsets: ["lao"],
  display: "swap",
  preload: false,
});

const siteUrl = process.env.APPLICATION_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "St Hugh's College Vientiane — International university pathways from Laos",
    template: "%s — St Hugh's College Vientiane",
  },
  description:
    "St Hugh's College Vientiane is an NCUK Study Centre in Lao PDR offering the International Foundation Year and International Year One, with pathways to universities worldwide.",
  applicationName: "St Hugh's College Vientiane",
  openGraph: { type: "website", siteName: "St Hugh's College Vientiane", locale: "en_GB" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${lao.variable} ${laoSerif.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        <DeployGuard />
      </body>
    </html>
  );
}
