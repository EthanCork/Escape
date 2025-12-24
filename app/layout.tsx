import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Irongate Penitentiary",
  description: "A top-down prison escape game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
