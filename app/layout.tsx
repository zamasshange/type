import type { Metadata, Viewport } from "next";
import { Roboto_Mono } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import "./globals.css";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Codeytype | world typing arena",
  description:
    "A typing test with real flags, live national / continental / world leaderboards, and a nations cup.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1814",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${robotoMono.variable} h-full antialiased`} data-theme="haven" suppressHydrationWarning>
      <body className={`${robotoMono.className} min-h-full`} suppressHydrationWarning>
        <Script id="th-theme" strategy="beforeInteractive">
          {`(function(){try{var s=JSON.parse(localStorage.getItem("typehaven-v1"));if(s&&s.settings&&s.settings.theme){document.documentElement.dataset.theme=s.settings.theme;}}catch(e){}})();`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
