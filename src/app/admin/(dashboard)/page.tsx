"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Calendar,
  FileText,
  Image,
  Video,
  MessageSquare,
  Mail,
  UserPlus,
  Wrench,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  programs: number;
  events: number;
  blogPosts: number;
  galleryImages: number;
  videos: number;
  testimonials: number;
  contactSubmissions: number;
  joinUsSubmissions: number;
  serviceRequests: number;
}

interface Unread {
  contacts: number;
  joinUs: number;
  services: number;
  total: number;
}

interface RecentContact {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  isRead: boolean;
  createdAt: string;
}

interface DashboardData {
  stats: Stats;
  unread: Unread;
  recentContacts: RecentContact[];
}

const statCards = [
  { key: "programs", label: "Programs", icon: Briefcase, color: "bg-blue-500" },
  { key: "events", label: "Events", icon: Calendar, color: "bg-purple-500" },
  { key: "blogPosts", label: "Blog Posts", icon: FileText, color: "bg-green-500" },
  { key: "galleryImages", label: "Gallery", icon: Image, color: "bg-yellow-500" },
  { key: "videos", label: "Videos", icon: Video, color: "bg-red-500" },
  { key: "testimonials", label: "Testimonials", icon: MessageSquare, color: "bg-pink-500" },
] as const;

const submissionCards = [
  { key: "contacts", label: "Contact Messages", icon: Mail, color: "bg-brand-blue", totalKey: "contactSubmissions" },
  { key: "joinUs", label: "Join Us Applications", icon: UserPlus, color: "bg-emerald-500", totalKey: "joinUsSubmissions" },
  { key: "services", label: "Service Requests", icon: Wrench, color: "bg-orange-500", totalKey: "serviceRequests" },
] as const;

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#1e293b] rounded-2xl p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Welcome back! Here&apos;s an overview of your platform.
        </p>
      </div>

      {/* Unread Alert */}
      {data.unread.total > 0 && (
        <div className="bg-brand-blue/10 border border-brand-blue/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-brand-blue shrink-0" />
          <p className="text-brand-blue text-sm font-medium">
            You have {data.unread.total} unread submission{data.unread.total !== 1 ? "s" : ""} waiting for review.
          </p>
        </div>
      )}

      {/* Content Stats */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Content Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => {
            const value = data.stats[card.key];
            return (
              <div
                key={card.key}
                className="bg-[#1e293b] rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      card.color
                    )}
                  >
                    <card.icon size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-sm text-gray-400 mt-1">{card.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submissions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Mail size={18} className="text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Submissions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {submissionCards.map((card) => {
            const unreadCount = data.unread[card.key];
            const total = data.stats[card.totalKey];
            return (
              <div
                key={card.key}
                className="bg-[#1e293b] rounded-2xl p-6 border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      card.color
                    )}
                  >
                    <card.icon size={20} className="text-white" />
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-white">{total}</p>
                <p className="text-sm text-gray-400 mt-1">{card.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Contact Messages */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-gray-400" />
          <h2 className="text-lg font-semibold text-white">
            Recent Contact Messages
          </h2>
        </div>
        <div className="bg-[#1e293b] rounded-2xl border border-gray-700/50 overflow-hidden">
          {data.recentContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No contact messages yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Name
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 hidden sm:table-cell">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 hidden md:table-cell">
                    Subject
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-gray-700/30 last:border-0 hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          contact.isRead ? "text-gray-300" : "text-white"
                        )}
                      >
                        {!contact.isRead && (
                          <span className="inline-block w-2 h-2 bg-brand-blue rounded-full mr-2" />
                        )}
                        {contact.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-400">
                        {contact.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-400">
                        {contact.subject || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                          contact.isRead
                            ? "bg-gray-700/50 text-gray-400"
                            : "bg-brand-blue/20 text-brand-blue"
                        )}
                      >
                        {contact.isRead ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-400">
                        {new Date(contact.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
