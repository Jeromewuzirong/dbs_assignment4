import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Realtime Weather Dashboard",
  description: "Week 4 multi-service realtime weather assignment"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-[family-name:var(--font-body)] antialiased">
        {children}
      </body>
    </html>
  );
}
