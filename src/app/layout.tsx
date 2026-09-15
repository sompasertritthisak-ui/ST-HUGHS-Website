import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
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
  themeColor: "#06090f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
