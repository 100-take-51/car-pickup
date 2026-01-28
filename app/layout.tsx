import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pickup.el-garage.net"),
  title: "廃車・不動車の引取相談｜名義違い・相続や代理の方も対応",
  description:
    "動かない車・長年放置した車・名義が違う車でもご相談いただけます。写真不要・見積不要。事故後に移動できなくなった車の引取についても対応しています。",
  verification: {
    // ★ metaタグではなく content の値だけ
    google: "SrVGQndnkynEXF04wemD5TKMECAPWsK42V1QPms1k_c",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
