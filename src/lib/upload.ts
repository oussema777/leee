import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getStorageClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

const BUCKET = "uploads";

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = "uploads"
): Promise<string> {
  const supabase = getStorageClient();
  const path = `${folder}/${Date.now()}-${fileName}`;

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
