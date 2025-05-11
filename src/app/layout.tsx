import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { NavItems } from "@/data/nav-items";
import { FloatingNav } from "@/components/layouts/floating-nav";
import ScrollToTop from "@/components/ui/scroll-to-top";
import Footer from "@/components/layouts/footer";

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
      <body className="dark">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={true}
        >
          <main>
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
