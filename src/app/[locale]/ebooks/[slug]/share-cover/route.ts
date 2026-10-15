import sharp from "sharp";
import { EBOOK_PUBLIC_ORIGIN, publicEbook } from "@/lib/ebooks/public-product";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await publicEbook(slug);
  if (!book?.coverUrl) return new Response("Not found", { status: 404 });
  const source = new URL(book.coverUrl, EBOOK_PUBLIC_ORIGIN);
  if (source.origin === "https://theleeexperience.com") source.hostname = "www.theleeexperience.com";
  const allowed = new Set([EBOOK_PUBLIC_ORIGIN, "https://theleeexperience.com"]);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) allowed.add(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin);
  if (!allowed.has(source.origin)) return new Response("Cover unavailable", { status: 404 });
  try {
    const response = await fetch(source, { signal: AbortSignal.timeout(10000), redirect: "error" });
    if (!response.ok) throw Error("Cover unavailable");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 5 * 1024 * 1024) throw Error("Cover too large");
    // JPEG lets social crawlers display the original cover even when uploaded as WebP.
    const jpeg = await sharp(bytes, { limitInputPixels: 16000000 })
      .rotate().resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), { headers: {
      "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new Response("Cover temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
