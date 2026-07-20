import type { Metadata } from "next";
import { Syne, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

// Display font — aggressive, wide, used for headlines ("NOCTURNE RAVE", tier names)
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Glitch/mono accent font — used for labels, tags, "SYSTEM STATUS", ticket codes
const glitchMono = JetBrains_Mono({
  variable: "--font-glitch",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Body font — clean, readable, mobile-friendly
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NOCTURNE RAVE 1.0 | Maduka University",
  description:
    "The official after-exam underground rave. Techno. Industrial. Cybernetic. You have to be there.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${glitchMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
