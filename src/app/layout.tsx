import type { Metadata } from "next";
import { fontVariables } from "@/lib/font";
import "@/app/globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "Storylio",
  description: "A personal journey through code, creativity, and craft.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased dark", fontVariables)}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-full font-sans">{children}</body>
    </html>
  );
}
