import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BackgroundOrbs } from "@/components/ui/BackgroundOrbs";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyDuitGua | Financial Tracker",
  description: "Advanced Financial Tracker with Liquid Glass UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <BackgroundOrbs />
          {children}
        </Providers>
      </body>
    </html>
  );
}
