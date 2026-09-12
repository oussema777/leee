/**
 * Match the headshots received from the client (Google-Forms file responses,
 * each named "... - <submitter>") to the 5 published experts, optimize them to
 * square 512px JPEGs, upload to Supabase Storage (bucket `uploads`, folder
 * `members`), and set boardMember.imageUrl on each row.
 *
 * Raeda Rashiiny is intentionally skipped — she chose internal-review-only and
 * is not published.
 *
 * Run: node scripts/insert-expert-photos.mjs
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const SRC_DIR =
  "C:/Users/Marketing Manager/Downloads/image/Photo_Upload a professional headshot_ (JPEG or PNG, max 5MB, minimum 300x300px) (File responses)";

// filename in SRC_DIR  ->  expert nameEn (exact DB value)
const MAP = [
  { file: "IMG_4792 - Yara Kurumilian.jpeg", nameEn: "Yara Kurumilian" },
  { file: "_DSF2458 - Ziad Alrefai.jpg", nameEn: "Ziad Al Refai" },
  { file: "IMAGE OUSSAMA - oussema lamine.png", nameEn: "Oussama Lamine" },
  { file: "IMG_8491 - NOUNAIDA PSYOGA.jpeg", nameEn: "Darine Saleh" },
  { file: "631246426_25993477786958025_8144050986774461161_n - Maya Kassem.jpg", nameEn: "Maya Kassem" },
];

const BUCKET = "uploads";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const prisma = new PrismaClient();

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  for (const { file, nameEn } of MAP) {
    const src = path.join(SRC_DIR, file);
    const raw = await readFile(src);

    // Square center-crop to 512px (cards render a 144px circle, object-cover).
    const out = await sharp(raw)
      .rotate() // honor EXIF orientation
      .resize(512, 512, { fit: "cover", position: "attention" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    const key = `members/${Date.now()}-${slug(nameEn)}.jpg`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(key, out, { contentType: "image/jpeg", upsert: true });
    if (upErr) throw new Error(`Upload failed for ${nameEn}: ${upErr.message}`);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
    const url = data.publicUrl;

    const res = await prisma.boardMember.updateMany({
      where: { nameEn, memberType: { in: ["EXPERT", "MENTOR"] } },
      data: { imageUrl: url },
    });

    console.log(
      `${res.count === 1 ? "✓" : "⚠ (" + res.count + " rows)"} ${nameEn}  ` +
        `${(raw.length / 1024).toFixed(0)}KB → ${(out.length / 1024).toFixed(0)}KB  ${url}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
