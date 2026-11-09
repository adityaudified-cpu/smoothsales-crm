import { Manrope, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-manrope",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
});

export const metadata = {
  title: "SmoothSales.ai — Multi-Tenant SaaS CRM",
  description: "High-velocity sales CRM with automated lead distribution and channel commissions",
  icons: {
    icon: "/images/smoothsales-logo.jpg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/auth-context";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${plexSans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
