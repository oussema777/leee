import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await hash("Admin@2026", 12);

  const user = await prisma.user.update({
    where: { email: "admin@leee.org" },
    data: { password: hashedPassword },
  });

  console.log(`Password reset for: ${user.email}`);
  console.log("New password: Admin@2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
