import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme";
import { BRAND } from "@/lib/constants/branding";
import "./globals.css";

const emilio = localFont({
  src: "../public/fonts/EmilioTest-Light.otf",
  variable: "--font-emilio",
  weight: "300",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: BRAND.name,
    // Every route sets its own title; this frames it without repeating the brand.
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.tagline,
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${emilio.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="skip-link inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-black/40 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Skip to content
          </a>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
