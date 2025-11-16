import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Not Broadway - NYC Theatre Guide",
  description: "Browse upcoming off-Broadway, off-off-Broadway, and non-profit theatre shows in NYC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
