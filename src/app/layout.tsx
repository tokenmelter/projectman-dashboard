import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Projectman Dashboard",
  description: "Project management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content="60" />
      </head>
      <body>{children}</body>
    </html>
  );
}
