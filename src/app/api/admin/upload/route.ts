import { NextRequest, NextResponse } from "next/server";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { uploadFile } from "@/lib/upload";

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const url = await uploadFile(buffer, file.name, file.type, folder);

    return NextResponse.json({ url });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Upload failed");
  }
}
