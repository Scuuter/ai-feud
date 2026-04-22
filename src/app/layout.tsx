import type { Metadata, Viewport } from "next";
import { Silkscreen, Inter } from "next/font/google";
import "./globals.css";

/**
 * Display face — stand-in for "Blocks" by Sam Horne (see design-system.md §2.3).
 * Silkscreen is a bitmap/LED-segment font that matches the Family Feud dot-matrix
 * aesthetic. Exposed as the CSS var `--font-blocks-src`.
 */
const fontBlocks = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-blocks-src",
  display: "swap",
});

/**
 * Base face — "Broadcast Sans" (Helvetica/Arial analogue).
 * Inter is deployed for crisp legibility at small sizes inside tiles and tickers.
 */
const fontBase = Inter({
  subsets: ["latin"],
  variable: "--font-base-src",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI FEUD — Design System",
  description:
    "Y2K Broadcast Brutalism meets Vice City. The canonical design system and demographic channel registry for Survey Says: AI Feud.",
};

export const viewport: Viewport = {
  themeColor: "#ffc0cb",
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-demographic="default"
      className={`${fontBlocks.variable} ${fontBase.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col font-base bg-[var(--color-room-bg)] text-[var(--color-room-ink)]">
        {children}
      </body>
    </html>
  );
}
