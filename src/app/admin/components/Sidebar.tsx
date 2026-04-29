"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Image,
  Video,
  MessageSquare,
  Users,
  Briefcase,
  Handshake,
  Mail,
  UserPlus,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  BarChart3,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Sliders", href: "/admin/sliders", icon: Layers },
      { label: "Programs", href: "/admin/programs", icon: Briefcase },
      { label: "Events", href: "/admin/events", icon: Calendar },
      { label: "Blog Posts", href: "/admin/blog", icon: FileText },
      { label: "Gallery", href: "/admin/gallery", icon: Image },
      { label: "Videos", href: "/admin/videos", icon: Video },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquare },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Board & Team", href: "/admin/members", icon: Users },
      { label: "Partners", href: "/admin/partners", icon: Handshake },
      { label: "Careers", href: "/admin/careers", icon: BookOpen },
    ],
  },
  {
    label: "Submissions",
    items: [
      { label: "Contact Messages", href: "/admin/contacts", icon: Mail },
      { label: "Join Us", href: "/admin/join-us", icon: UserPlus },
      { label: "Service Requests", href: "/admin/services", icon: Briefcase },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-[#0f172a] border-r border-gray-700/50 flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-white font-semibold text-lg">LEE</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20"
                          : "text-gray-400 hover:text-white hover:bg-gray-700/40"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon size={20} className="shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
