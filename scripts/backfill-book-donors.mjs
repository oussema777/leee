import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

try {
  const submissions = await db.bookDonationSubmission.findMany({
    where: { donorId: null },
    select: { id: true, fullName: true, phone: true, email: true, inventoryItems: { select: { id: true } } },
  });

  for (const submission of submissions) {
    await db.$transaction(async (tx) => {
      const donor = await tx.bookDonor.create({
        data: {
          type: "INDIVIDUAL",
          displayName: submission.fullName,
          phone: submission.phone,
          email: submission.email,
          publicRecognition: false,
        },
      });
      await tx.bookDonationSubmission.update({ where: { id: submission.id }, data: { donorId: donor.id } });
      if (submission.inventoryItems.length) {
        await tx.bookInventoryItem.updateMany({
          where: { id: { in: submission.inventoryItems.map((item) => item.id) }, donorId: null },
          data: { donorId: donor.id },
        });
      }
    });
  }

  console.log(`Backfilled ${submissions.length} historical book donor profile(s).`);
} finally {
  await db.$disconnect();
}
