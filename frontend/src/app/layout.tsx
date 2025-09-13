import React from "react";
import { Providers } from "../providers/RootProviders";
import "./globals.css";

export const metadata = {
  title: "SportBeacon AI - Intelligent Sports Management",
  description: "AI-powered sports management platform for coaches, players, and organizations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 