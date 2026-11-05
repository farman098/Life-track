import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeTrack — Your life, in balance",
  description: "A simple personal life management dashboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
