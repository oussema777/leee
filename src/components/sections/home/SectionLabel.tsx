import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  color?: "red" | "yellow" | "pink" | "green" | "blue" | "purple";
  className?: string;
}

const colorMap = {
  red: "text-red-500",
  yellow: "text-amber-500",
  pink: "text-pink-500",
  green: "text-emerald-600",
  blue: "text-brand-blue-deeper",
  purple: "text-purple-600",
};

const lineColorMap = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  pink: "bg-pink-500",
  green: "bg-emerald-600",
  blue: "bg-brand-blue-deeper",
  purple: "bg-purple-600",
};

export function SectionLabel({
  children,
  color = "blue",
  className,
}: SectionLabelProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className={cn("w-8 h-[2px] rounded-full", lineColorMap[color])} />
      <span
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.25em] leading-none",
          colorMap[color]
        )}
      >
        {children}
      </span>
    </span>
  );
}
