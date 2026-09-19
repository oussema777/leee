import { NextRequest, NextResponse } from "next/server";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { uploadFile } from "@/lib/upload";
import { optimizeImageUpload } from "@/lib/image-optimization";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return errorResponse("No file provided", 400);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return errorResponse("Image is larger than 12 MB", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const optimized = await optimizeImageUpload(buffer);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    const url = await uploadFile(
      optimized.buffer,
      `${baseName}.${optimized.extension}`,
      optimized.contentType,
      folder
    );

    return NextResponse.json({ url });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Upload failed");
  }
}
