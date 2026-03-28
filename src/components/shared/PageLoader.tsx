"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Hide loader when route changes (navigation completed)
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Show loader when a same-origin link is clicked
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, anchors, and non-navigation links
      if (
        anchor.target === "_blank" ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("http")
      ) {
        return;
      }

      // Only show loader for actual page navigation (different path)
      const url = new URL(href, window.location.origin);
      if (url.pathname !== pathname) {
        setLoading(true);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/95 flex items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#5895D0] rounded-full animate-spin" />
    </div>
  );
}
