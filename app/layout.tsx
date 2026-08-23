import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Placeholder faces. Phase 6 swaps these for Schibsted Grotesk + IBM Plex Mono
// per master plan Part 0. The CSS variable names are what globals.css reads,
// so the swap is a one-line change here.
const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dayflow — HRMS",
  description: "Every workday, perfectly aligned.",
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
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
