// Enables/disables the user-authorized ebook-only management payment test.
// No emails, orders, payment approvals or receiving-account records are changed.
import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

nextEnv.loadEnvConfig(process.cwd());
const db = new PrismaClient();
const id = "ebook-management-testing";
const args = process.argv.slice(2);
if (args.some(arg => !["--enable", "--disable"].includes(arg)) || args.length > 1)
  throw Error("Use no arguments to inspect, --enable or --disable.");
try {
  const result = await db.$transaction(async tx => {
    const shared = await tx.bookWhishSettings.findMany({ where: { id: { in: ["book-restore", "book-bank-audi"] } }, orderBy: { id: "asc" } });
    if (args[0] === "--enable") {
      assert.equal(shared.length, 2, "Both saved receiving methods are required.");
      for (const row of shared) {
        const config = row.config;
        assert(config.accountName && config.accountNumber && config.qrImageUrl, "Saved receiving details are incomplete: " + row.id);
      }
    }
    if (args.length) {
      const config = { enabled: args[0] === "--enable", purpose: "User-authorized management ebook checkout testing", authorizedOn: "2026-10-15" };
      await tx.bookWhishSettings.upsert({ where: { id }, create: { id, config, updatedBy: "user-authorized-management-test" }, update: { config, updatedBy: "user-authorized-management-test" } });
    }
    const after = await tx.bookWhishSettings.findMany({ where: { id: { in: ["book-restore", "book-bank-audi"] } }, orderBy: { id: "asc" } });
    assert.deepEqual(after, shared, "Shared receiving settings must remain unchanged.");
    const test = await tx.bookWhishSettings.findUnique({ where: { id } });
    return { managementTesting: test?.config?.enabled === true, sharedMethodsUnchanged: true, scope: "ebooks", expires: null };
  });
  console.log(JSON.stringify(result));
} finally { await db.$disconnect(); }
