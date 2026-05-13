import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Where Is My Bus | Live Delhi NCR Bus Tracker",
  description: "Track government buses live across Delhi, Haryana, UP and Punjab. Find routes, check fares, view passenger counts and get real-time bus locations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
