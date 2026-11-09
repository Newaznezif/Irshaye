import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "IRSHAYE — Climate-Smart Agricultural Intelligence for Ethiopia",
    template: "%s | IRSHAYE",
  },
  description:
    "IRSHAYE is an AI-assisted digital platform for climate-smart agriculture in Ethiopia: location-based climate intelligence, crop advisory, soil-management guidance, agricultural market prices, and evidence-based recommendations with full data transparency.",
  applicationName: "IRSHAYE",
  icons: {
    icon: [{ url: "/Logo.svg", type: "image/svg+xml" }],
    shortcut: "/Logo.svg",
    apple: "/Logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a7f4b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="app-font min-h-dvh bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
