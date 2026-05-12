import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Abril_Fatface } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["400", "700", "900"] });
const abril = Abril_Fatface({ subsets: ["latin"], variable: "--font-abril", weight: "400" });

export const metadata: Metadata = {
  title: "VINITO Pichincha — CARTA",
  description: "Bar de Vinos. Jujuy 2248, Pichincha, Rosario.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} ${abril.variable}`}>
      <body className="font-sans antialiased bg-vinito-cream text-vinito-black" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
