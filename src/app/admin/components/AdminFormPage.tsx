"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

interface AdminFormPageProps {
  title: string;
  backHref: string;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  children: React.ReactNode;
}

export default function AdminFormPage({
  title,
  backHref,
  onSubmit,
  loading = false,
  children,
}: AdminFormPageProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={backHref}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="bg-[#1e293b] rounded-2xl border border-gray-700/50 p-6 space-y-5">
          {children}
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href={backHref}
            className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
