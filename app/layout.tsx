import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Background Remover — Free White Background Tool",
  description: "Remove image backgrounds and generate clean white background photos instantly. Free for 3 images/day. Perfect for ecommerce product photos.",
  keywords: "background remover, remove background, white background, product photo, ecommerce",
  openGraph: {
    title: "Background Remover — Free White Background Tool",
    description: "Remove image backgrounds instantly. Get clean white background photos for ecommerce.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
