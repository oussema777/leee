/**
 * Create or reset an admin user — robust standalone version.
 *
 * Usage (run from the leee-experience project folder):
 *   node scripts/create-admin.mjs <email> <password> [name]
 *
 * With no args it uses the defaults below. Safe to re-run (upserts).
 * Explicitly loads .env / .env.local so it works as a plain node script.
 */
import { readFileSync } from "node:fs";
import { hash } from "bcryptjs";

// --- Load env files manually (Prisma CLI does this; a bare node script does not) ---
for (const file of [".env.local", ".env"]) {
  try {
    const txt = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      let [, k, v] = m;
      v = v.replace(/^["']|["']$/g, ""); // strip surrounding quotes
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {
    /* file may not exist — fine */
  }
}

if (!process.env.DATABASE_URL) {
  console.error("\n❌ DATABASE_URL is not set and was not found in .env/.env.local.");
  console.error("   Run this from inside the leee-experience folder.\n");
  process.exit(1);
}

// Import Prisma AFTER env is populated.
const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();

const email = (process.argv[2] || "admin@theleeexperience.com").toLowerCase();
const password = process.argv[3];
const name = process.argv[4] || "Administrator";

if (!password) {
  console.error("\nUsage: node scripts/create-admin.mjs <email> <password> [name]");
  console.error("A password must be supplied as the 3rd argument (no hardcoded default).\n");
  process.exit(1);
}

async function main() {
  // Show DB host (sanitized) so we know which database we hit.
  const host = (process.env.DATABASE_URL.match(/@([^/:]+)/) || [])[1] || "unknown";
  console.log(`\nDatabase host: ${host}`);

  const before = await db.user.findMany({ select: { email: true, role: true } });
  console.log("Existing users BEFORE:", JSON.stringify(before));

  const hashed = await hash(password, 12);
  await db.user.upsert({
    where: { email },
    update: { password: hashed, role: "ADMIN" },
    create: { email, password: hashed, name, role: "ADMIN" },
  });

  const after = await db.user.findMany({ select: { email: true, role: true } });
  console.log("Existing users AFTER: ", JSON.stringify(after));

  console.log("\n✅ Admin ready. Log in at http://localhost:3000/admin/login with:");
  console.log("   Email:    " + email);
  console.log("   Password: " + password);
  console.log("\n(Email is stored lowercased — type it lowercase at login.)\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Failed:", e.message, "\n");
    process.exit(1);
  })
  .finally(() => db.$disconnect());
