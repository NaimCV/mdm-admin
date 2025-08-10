import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AdminGuard from "./components/AdminGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Panel de Administración - Mimos de Madera",
  description: "Sistema de administración para Mimos de Madera",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AdminGuard>
          {children}
        </AdminGuard>
      </body>
    </html>
  );
}
