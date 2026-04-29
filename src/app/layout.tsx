import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | The LEE Experience",
    default: "The LEE Experience",
  },
  description:
    "The LEE Experience - Empowering communities through social impact, capacity building, and sustainable development in Lebanon and the MENA region.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
