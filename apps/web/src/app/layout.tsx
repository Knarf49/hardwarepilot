import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ChatDock } from "@/components/chat/chat-dock";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HardwarePilot",
  description: "Form-first hardware design platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <nav className="border-b border-neutral-800 px-6 py-3 flex items-center gap-4">
          <a href="/" className="font-semibold text-lg text-[#7C5CFC]">
            HardwarePilot
          </a>
        </nav>
        <main className="flex-1 p-6">{children}</main>
        <ChatDock />
      </body>
    </html>
  );
}
