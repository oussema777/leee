import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/upload";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 5 * 1024 * 1024;
const FOLDER = "book-restore";
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function sniffImageType(buffer: Buffer) {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function POST(request: NextRequest) {
  if (!rateLimit(`pub-book-cover:${clientIp(request)}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image is larger than 5 MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = sniffImageType(buffer);
    if (!contentType) {
      return NextResponse.json({ error: "Only verified JPEG, PNG, or WebP images are allowed" }, { status: 400 });
    }

    const url = await uploadFile(buffer, `${randomUUID()}.${extensions[contentType]}`, contentType, FOLDER);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Book cover upload failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
