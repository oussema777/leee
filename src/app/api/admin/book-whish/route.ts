import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseWhishConfig, whishConfigSchema, readiness } from "@/lib/book-orders/whish-config";
import { privateJson, withPaymentAdmin } from "@/lib/book-orders/whish-server";

export async function GET(request: NextRequest) {
  try {
    const auth = await withPaymentAdmin(request);
    if ("error" in auth) return auth.error!;
    const row = await db.bookWhishSettings.findUnique({ where: { id: "book-restore" } });
    const config = parseWhishConfig(row?.config);
    return privateJson({ config, issues: readiness(config), version: row?.updatedAt.toISOString() || null });
  } catch { return privateJson({ error: "Could not load payment setup. Check that the Whish database patch has been applied." }, 500); }
}
export async function PUT(request: NextRequest) {
  try {
    const auth = await withPaymentAdmin(request);
    if ("error" in auth) return auth.error!;
    const body = await request.json();
    const parsed = whishConfigSchema.safeParse(body);
    if (!parsed.success) return privateJson({ error: parsed.error.issues[0]?.message || "Check the setup." }, 400);
    if (body.version !== null && (typeof body.version !== "string" || Number.isNaN(Date.parse(body.version)))) {
      return privateJson({ error: "Reload payment setup before saving." }, 400);
    }
    const config = parsed.data;
    const row = await db.bookWhishSettings.findUnique({ where: { id: "book-restore" } });
    if ((row?.updatedAt.toISOString() || null) !== body.version) {
      return privateJson({ error: "Payment setup changed in another session. Reload before saving." }, 409);
    }
    const old = parseWhishConfig(row?.config);
    if ((old.accountName !== config.accountName || old.accountNumber !== config.accountNumber || old.qrImageUrl !== config.qrImageUrl) && config.qrVerified) {
      return privateJson({ error: "Save the changed receiving details or QR with verification cleared, then verify the saved QR." }, 409);
    }
    const issues = readiness(config);
    if (config.enabled && issues.length) return privateJson({ error: issues.join(" ") }, 400);
    const saved = await db.$transaction(async tx => {
      if (row) {
        const result = await tx.bookWhishSettings.updateMany({
          where: { id: row.id, updatedAt: row.updatedAt }, data: { config, updatedBy: auth.session.userId },
        });
        if (result.count !== 1) throw Error("STALE_SETUP");
        return tx.bookWhishSettings.findUniqueOrThrow({ where: { id: row.id } });
      }
      return tx.bookWhishSettings.create({ data: { id: "book-restore", config, updatedBy: auth.session.userId } });
    });
    return privateJson({ config, issues, version: saved.updatedAt.toISOString() });
  } catch (e) {
    if (e instanceof Error && e.message === "STALE_SETUP" || e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return privateJson({ error: "Payment setup changed in another session. Reload before saving." }, 409);
    }
    return privateJson({ error: "Could not save payment setup. Check that the Whish database patch has been applied." }, 500);
  }
}
