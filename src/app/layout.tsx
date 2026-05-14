import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Jamshidbek & Gulshoda | Taklifnoma",
    template: "%s | Jamshidbek & Gulshoda",
  },
  description:
    "Jamshidbek va Gulshodaning to'y taklifnomasi, sana, manzil va RSVP formasi bilan.",
  applicationName: "Taklifnoma",
  keywords: ["wedding", "taklifnoma", "RSVP", "Jamshidbek", "Gulshoda"],
  openGraph: {
    title: "Jamshidbek & Gulshoda | Taklifnoma",
    description:
      "Onlayn to'y taklifnomasi: tadbir tafsilotlari, xarita va RSVP formasi.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jamshidbek & Gulshoda | Taklifnoma",
    description:
      "Onlayn to'y taklifnomasi: tadbir tafsilotlari, xarita va RSVP formasi.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FDFBF7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
