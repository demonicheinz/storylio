import "@/styles/globals.css";
import { FloatingNav, Footer } from "@/components/layouts";
import { ScrollToTop } from "@/components/ui";
import { NavItems } from "@/data";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";

import type { Metadata } from "next";
const roboto_font = localFont({
  src: [
    {
      path: "../fonts/Roboto-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Roboto-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Roboto-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/Roboto-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-sans",
  preload: true,
});

const jetbrains_mono_font = localFont({
  src: [
    {
      path: "../fonts/JetBrainsMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/JetBrainsMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/JetBrainsMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-mono",
  preload: true,
});

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
      suppressHydrationWarning={true}
      className={`${roboto_font.variable} ${jetbrains_mono_font.variable} antialiased`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={true}
        >
          <main className="content-area">
            <ScrollToTop />
            <FloatingNav navItems={NavItems} />
            {children}
            <Footer />
          </main>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
