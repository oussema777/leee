import { NextRequest } from "next/server";
import { customerTestAccess } from "@/lib/cybersource/customer-config";
import { privateJson } from "@/lib/book-orders/whish-server";
export async function GET(request: NextRequest) {
  const available = await customerTestAccess(request);
  return privateJson({ available, testMode: available });
}
