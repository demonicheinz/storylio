import type { Metadata } from "next";
import { fontVariables } from "@/lib/font";
import "@/app/globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Storylio",
  description: "A personal journey through code, creativity, and craft.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", fontVariables)}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
