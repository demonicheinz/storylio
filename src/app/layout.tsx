import type { Metadata } from "next";
import { fontVariables } from "@/lib/font";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/providers/index";

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
    <html
      lang="en"
      className={cn("h-full antialiased", fontVariables)}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
