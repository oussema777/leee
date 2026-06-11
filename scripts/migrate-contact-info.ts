/** Migrate site contact details into the ContactInfo key/value table. Idempotent: skips if rows exist. */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Keys MUST match the admin Settings → Contact tab + src/lib/data/contact.ts.
const contactInfo = [
  { key: "phone", valueEn: "+961 3 002 430", valueAr: "+961 3 002 430" },
  { key: "email", valueEn: "info@theleeexperience.com", valueAr: "info@theleeexperience.com" },
  { key: "whatsapp", valueEn: "96103600747", valueAr: "96103600747" },
  { key: "address", valueEn: "Beirut, Lebanon | Cairo, Egypt", valueAr: "بيروت، لبنان | القاهرة، مصر" },
  {
    key: "mapUrl",
    valueEn:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d106069.67600028!2d35.4309!3d33.8938!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151f17215880a78f%3A0x729182bae99836b4!2sBeirut%2C%20Lebanon!5e0!3m2!1sen!2s!4v1",
    valueAr:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d106069.67600028!2d35.4309!3d33.8938!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151f17215880a78f%3A0x729182bae99836b4!2sBeirut%2C%20Lebanon!5e0!3m2!1sen!2s!4v1",
  },
];

async function main() {
  const existing = await prisma.contactInfo.count();
  if (existing > 0) { console.log(`Skip: ${existing} contact-info rows exist.`); return; }
  for (const c of contactInfo) {
    await prisma.contactInfo.create({ data: c });
  }
  console.log(`Done! ${contactInfo.length} contact-info rows created.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
