const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();
Promise.all(["book-restore", "book-bank-audi"].map(async (id) => {
  const row = await db.bookWhishSettings.findUnique({
    where: { id }, select: { config: true, updatedAt: true },
  });
  const config = row?.config || {};
  return {
    id,
    configured: !!row,
    enabled: config.enabled === true,
    qrVerified: config.qrVerified === true,
    termsVerified: config.termsVerified === true,
    hasQr: !!config.qrImageUrl,
    updatedAt: row?.updatedAt,
  };
})).then((state) => console.log(JSON.stringify(state, null, 2)))
  .catch((error) => console.error("Payment status unavailable:", error.code || error.message))
  .finally(() => db.$disconnect());
