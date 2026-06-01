import localFont from "next/font/local";

export const clashDisplay = localFont({
  src: [
    {
      path: "../assets/fonts/ClashDisplay-Variable.woff2",
      weight: "200 700",
      style: "normal",
    },
  ],
  variable: "--font-heading",
  display: "swap",
});

export const satoshi = localFont({
  src: [
    {
      path: "../assets/fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "../assets/fonts/Satoshi-VariableItalic.woff2",
      weight: "300 900",
      style: "italic",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const jetBrainsMono = localFont({
  src: [
    {
      path: "../assets/fonts/JetBrainsMono-Variable.woff2",
      weight: "100 800",
      style: "normal",
    },
    {
      path: "../assets/fonts/JetBrainsMono-VariableItalic.woff2",
      weight: "100 800",
      style: "italic",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const fontVariables = [
  clashDisplay.variable,
  satoshi.variable,
  jetBrainsMono.variable,
].join(" ");
