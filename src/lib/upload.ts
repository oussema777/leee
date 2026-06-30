import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getStorageClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

const BUCKET = "uploads";

// Supabase Storage object keys only allow a limited set of characters.
// Strip accents/smart-quotes/spaces and anything non-safe so uploads of
// human-named files (e.g. "34 MSMEs … "LEE Incubator".jpg") don't fail.
function sanitizeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const hasExt = dot > 0 && dot < name.length - 1;
  const ext = hasExt ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (hasExt ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80) || "file";
  return ext ? `${base}.${ext}` : base;
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = "uploads"
): Promise<string> {
  const supabase = getStorageClient();
  const path = `${folder}/${Date.now()}-${sanitizeFileName(fileName)}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(url: string): Promise<void> {
  if (!url || !url.includes(BUCKET)) return;

  const supabase = getStorageClient();
  // Extract path from full URL
  const parts = url.split(`${BUCKET}/`);
  if (parts.length < 2) return;

  const path = parts[1];
  await supabase.storage.from(BUCKET).remove([path]);
}
