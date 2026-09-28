import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { bankAudiConfigSchema, bankAudiReadiness, parseBankAudiConfig } from "@/lib/book-orders/bank-audi-config";
import { privateJson, withPaymentAdmin } from "@/lib/book-orders/whish-server";

const id = "book-bank-audi";
export async function GET(request: NextRequest) {
  try {
    const auth = await withPaymentAdmin(request);
    if ("error" in auth) return auth.error!;
    const row = await db.bookWhishSettings.findUnique({ where: { id } });
    const config = parseBankAudiConfig(row?.config);
    return privateJson({ config, issues: bankAudiReadiness(config), version: row?.updatedAt.toISOString() || null });
  } catch { return privateJson({ error: "Could not load Bank Audi setup. Check the payment database patch." }, 500); }
}
export async function PUT(request: NextRequest) {
  try {
    const auth = await withPaymentAdmin(request);
    if ("error" in auth) return auth.error!;
    const body = await request.json();
    const parsed = bankAudiConfigSchema.safeParse(body);
    if (!parsed.success) return privateJson({ error: parsed.error.issues[0]?.message || "Check the setup." }, 400);
    if (body.version !== null && (typeof body.version !== "string" || Number.isNaN(Date.parse(body.version)))) return privateJson({ error: "Reload setup before saving." }, 400);
    const config = parsed.data;
    const row = await db.bookWhishSettings.findUnique({ where: { id } });
    if ((row?.updatedAt.toISOString() || null) !== body.version) return privateJson({ error: "Setup changed in another session. Reload before saving." }, 409);
    const old = parseBankAudiConfig(row?.config);
    if (["accountName", "accountNumber", "iban", "qrImageUrl"].some(key => old[key as keyof typeof old] !== config[key as keyof typeof config]) && (config.qrVerified || config.termsVerified)) {
      return privateJson({ error: "Save changed bank details with both verifications cleared, then verify the saved details." }, 409);
    }
    const issues = bankAudiReadiness(config);
    if (config.enabled && issues.length) return privateJson({ error: issues.join(" ") }, 400);
    const saved = await db.$transaction(async tx => {
      if (row) {
        const result = await tx.bookWhishSettings.updateMany({ where: { id, updatedAt: row.updatedAt }, data: { config, updatedBy: auth.session.userId } });
        if (result.count !== 1) throw Error("STALE_SETUP");
        return tx.bookWhishSettings.findUniqueOrThrow({ where: { id } });
      }
      return tx.bookWhishSettings.create({ data: { id, config, updatedBy: auth.session.userId } });
    });
    return privateJson({ config, issues, version: saved.updatedAt.toISOString() });
  } catch (e) {
    if (e instanceof Error && e.message === "STALE_SETUP" || e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return privateJson({ error: "Setup changed in another session. Reload before saving." }, 409);
    return privateJson({ error: "Could not save Bank Audi setup." }, 500);
  }
}
