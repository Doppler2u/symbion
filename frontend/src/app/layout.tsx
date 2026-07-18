import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SYMBION // AGENTIC NETWORK",
  description: "Trustless Affiliate Protocol on Arc Testnet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrains.className} antialiased selection:bg-arc-green selection:text-black`}>
        {children}
      </body>
    </html>
  );
}
