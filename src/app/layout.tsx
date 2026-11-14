import type { Metadata } from "next";
import AuthProvider from "@/components/auth-provider";
import TopLoadingBar from "@/components/top-loading-bar";
import ToastHost from "@/components/toast-host";
import { clerkConfigured } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "dear, letter — a slower kind of connection",
  description: "Write to the people you love. Let your letters take the long way there.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body><AuthProvider enabled={clerkConfigured}>{children}<TopLoadingBar /><ToastHost /></AuthProvider></body>
    </html>
  );
}
