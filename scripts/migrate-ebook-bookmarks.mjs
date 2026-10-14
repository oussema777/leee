// Additive, idempotent migration. No orders or reader accounts are changed.
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
nextEnv.loadEnvConfig(process.cwd());
const local = process.argv.includes("--local");
const url = local ? process.env.EBOOK_TEST_DATABASE_URL : process.env.DATABASE_URL;
if (!url || (local && !["localhost", "127.0.0.1"].includes(new URL(url).hostname))) throw Error("Invalid database target");
if (!process.argv.includes("--apply")) throw Error("Pass --apply to add the bookmarks table");
const db = new PrismaClient({ datasourceUrl: url });
try {
  const sql = await readFile("prisma/patches/20261012_ebook_bookmarks.sql", "utf8");
  await db.$transaction(async tx => {
    for (const statement of sql.split(";").map(s => s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
  });
  console.log(`Bookmarks table ready (${local ? "isolated tests" : "configured website database"}); row-level security enabled.`);
} finally { await db.$disconnect(); }
