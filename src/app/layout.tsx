import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/frontend/providers";
import { SessionProvider } from "@/frontend/session-provider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RememberMe - Calm Alzheimer's Care & Memory Platform",
  description: "An emotionally supportive and highly accessible platform designed to help Alzheimer's patients stay connected to their families, routines, medications, and doctors.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${outfit.variable} h-full antialiased font-sans`}>
        <SessionProvider>
          <AppProviders>{children}</AppProviders>
        </SessionProvider>
      </body>
    </html>
  );
}
