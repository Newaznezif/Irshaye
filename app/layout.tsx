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
    icon: [{ url: "/Irshayelogos/2.png", type: "image/png", sizes: "any" }],
    shortcut: "/Irshayelogos/2.png",
    apple: [{ url: "/Irshayelogos/2.png" }],
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
