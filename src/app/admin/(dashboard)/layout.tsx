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
      <div className="flex min-h-screen max-w-full overflow-x-hidden bg-[#0f172a]">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
