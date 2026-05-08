import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://theleeexperience.com"),
  title: {
    template: "%s | The LEE Experience",
    default: "The LEE Experience",
  },
  description:
    "The LEE Experience - Empowering communities through social impact, capacity building, and sustainable development in Lebanon and the MENA region.",
  openGraph: {
    type: "website",
    siteName: "The LEE Experience",
    locale: "en_US",
    images: [
      {
        url: "/LEEE-LOGO.png",
        width: 512,
        height: 512,
        alt: "The LEE Experience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lee_experience",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Social Enterprise",
  keywords: [
    "LEE Experience",
    "social enterprise",
    "MENA",
    "Lebanon",
    "capacity building",
    "economic empowerment",
    "sustainable development",
    "women empowerment",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
