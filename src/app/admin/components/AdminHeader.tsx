"use client";

import { useRouter } from "next/navigation";
import { LogOut, Bell, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminHeader() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const roleLabel = user?.role
    ? user.role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  return (
    <header className="h-16 bg-[#1e293b] border-b border-gray-700/50 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h2 className="text-white font-semibold text-lg">Admin Dashboard</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50 transition-colors">
          <Bell size={20} />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
          >
            <div className="w-9 h-9 bg-brand-blue rounded-full flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            {user && (
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">{roleLabel}</p>
              </div>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e293b] border border-gray-700/50 rounded-xl shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-700/50">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700/40 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
