"use client";

import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import { ToastProvider } from "../components/AdminToast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#0f172a]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
