import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Exoplanet Habitability Explorer",
  description: "Discover potentially habitable worlds beyond our solar system."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0B1026] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
