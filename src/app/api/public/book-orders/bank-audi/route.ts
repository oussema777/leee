import { isBankAudiAvailable } from "@/lib/book-orders/bank-audi-config";
import { getBankAudiConfig, privateJson } from "@/lib/book-orders/whish-server";
export async function GET() {
  return privateJson({ available: isBankAudiAvailable(await getBankAudiConfig()) });
}
