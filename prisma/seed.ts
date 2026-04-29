import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@leee.org" },
  });

  if (existingAdmin) {
    console.log("Admin user already exists, skipping...");
    return;
  }

  const hashedPassword = await hash("Admin@2026", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@lee.org",
      password: hashedPassword,
      name: "LEE Admin",
      role: "SUPER_ADMIN",
    },
  });

  console.log(`Admin user created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
