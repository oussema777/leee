import { isWhishAvailable, WHISH_AMOUNTS } from "@/lib/book-orders/whish-config";
import { getWhishConfig, privateJson } from "@/lib/book-orders/whish-server";
export async function GET() {
  const available = isWhishAvailable(await getWhishConfig());
  return privateJson({ available, amounts: available ? WHISH_AMOUNTS : [], currency: "USD" });
}
