// path: src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppNavbar from "@/components/AppNavbar";
import ToasterClient from "@/components/ToasterClient";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "FitFuel AI",
  description: "Track meals, water, body, and get an AI diet plan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider>
          <AppNavbar />
          <main className="container py-6">{children}</main>
          <ToasterClient />
        </ThemeProvider>
      </body>
    </html>
  );
}
