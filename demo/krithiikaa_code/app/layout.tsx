import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-sw";
import "./globals.css";

/**
 * Schibsted Grotesk for all UI text, IBM Plex Mono for every number — brand
 * guidelines Part 0. `display: swap` so text paints in a fallback immediately
 * rather than leaving the screen blank while a face downloads.
 *
 * 700 is included for the wordmark only; UI text stops at 600.
 */
const sans = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * Times, currency, percentages, day counts and login IDs. globals.css forces
 * tabular figures on everything using this face, so a recomputed salary column
 * cannot shift width.
 */
const mono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dayflow — HRMS",
  description: "Every workday, perfectly aligned.",
  applicationName: "Dayflow",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Dayflow",
    // The brand surface behind the status bar while the app boots.
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  // Plum in the browser chrome, so the app does not stop at the viewport edge
  // once it is installed to a home screen.
  //
  // The one hex literal outside globals.css, and unavoidable: this is a metadata
  // string read by the browser and the OS before any stylesheet is parsed, so it
  // cannot be var(--plum). Keep it in step with --plum by hand.
  themeColor: "#502D55",
  width: "device-width",
  initialScale: 1,
  // Zoom stays enabled. Locking it out is an accessibility regression, and the
  // layout does not need it — the mobile pass makes every screen fit at 390px.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variables must sit on <html>, not <body>: globals.css applies
    // `font-sans` to <html>, and CSS custom properties only inherit downward.
    // With the variables on <body>, var(--font-sans) was undefined at <html>
    // and every page silently fell back to Times New Roman.
    // lang="en-IN", not "en": the browser picks a native date-input format from the
    // document language, and "en" gives American mm/dd/yyyy while every date the
    // app renders itself is dd/mm/yyyy. Two formats on one screen is a data-entry
    // bug waiting to happen.
    <html lang="en-IN" className={`${sans.variable} ${mono.variable}`}>
      <body className="antialiased">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
