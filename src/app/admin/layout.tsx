import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "LEEE Admin Dashboard",
  description: "Admin dashboard for LEEE Experience platform",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f172a]">{children}</body>
    </html>
  );
}
