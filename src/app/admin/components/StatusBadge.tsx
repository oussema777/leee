"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/20 text-emerald-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  danger: "bg-red-500/20 text-red-400",
  info: "bg-brand-blue/20 text-brand-blue",
  neutral: "bg-gray-700/50 text-gray-400",
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export default function StatusBadge({ label, variant = "neutral", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

// Helpers for common patterns
export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <StatusBadge
      label={isActive ? "Active" : "Inactive"}
      variant={isActive ? "success" : "neutral"}
    />
  );
}

export function ReadBadge({ isRead }: { isRead: boolean }) {
  return (
    <StatusBadge
      label={isRead ? "Read" : "Unread"}
      variant={isRead ? "neutral" : "info"}
    />
  );
}

export function PublishBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <StatusBadge
      label={isPublished ? "Published" : "Draft"}
      variant={isPublished ? "success" : "warning"}
    />
  );
}
