import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Household employer platform",
  description: "Vetting and payroll for household employers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}