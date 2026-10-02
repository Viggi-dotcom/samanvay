import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Samanvay Intelligence — AI-Powered Governance Intelligence Platform",
  description:
    "Unified cross-scheme governance analytics anchored on LGD codes. Convergence intelligence, anomaly detection, and traceable natural-language querying across MGNREGA, PM-KISAN, and PMAY-G.",
  keywords: [
    "Samanvay",
    "Governance Intelligence",
    "MGNREGA",
    "PM-KISAN",
    "PMAY-G",
    "LGD",
    "Cross-scheme convergence",
    "India Government",
  ],
  authors: [{ name: "Samanvay Intelligence Platform" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
