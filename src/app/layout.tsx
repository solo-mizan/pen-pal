import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/auth-provider";
import TopLoadingBar from "@/components/top-loading-bar";
import ToastHost from "@/components/toast-host";
import { clerkConfigured } from "@/lib/config";
import { Atma, Caveat } from "next/font/google";
import "./globals.css";

const caveat = Caveat({ subsets: ["latin"], weight: ["500", "600"], display: "swap", variable: "--font-caveat" });
const atma = Atma({ subsets: ["bengali", "latin"], weight: ["400", "500"], display: "swap", variable: "--font-atma" });

export const metadata: Metadata = {
  title: "dear, letter — a slower kind of connection",
  description: "Write to the people you love. Let your letters take the long way there.",
  icons: { icon: "/icons/icon-192.png", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#f8f5ef" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={`${caveat.variable} ${atma.variable}`}><AuthProvider enabled={clerkConfigured}>{children}<TopLoadingBar /><ToastHost /></AuthProvider></body>
    </html>
  );
}
