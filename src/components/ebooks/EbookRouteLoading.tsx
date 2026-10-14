"use client";
import { useLocale } from "next-intl";
import { EbookPageSkeleton } from "./EbookSkeleton";
export function EbookRouteLoading({ payment = false }: { payment?: boolean }) {
  return <EbookPageSkeleton ar={useLocale() === "ar"} payment={payment} />;
}
