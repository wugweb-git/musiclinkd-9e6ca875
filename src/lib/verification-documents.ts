import { supabase } from "@/integrations/supabase/client";

/*
 * Verification document uploads. Files go to the private verification-documents bucket at
 * <user id>/<request id>/<file>; storage RLS takes them only while that request is the user's draft.
 * Bucket and limits: supabase/migrations/20260915170000_verification.sql.
 */

const BUCKET = "verification-documents";
const MAX_BYTES = 10 * 1024 * 1024;
const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** Value for an `<input type="file" accept>` that matches what the bucket takes. */
export const VERIFICATION_DOCUMENT_ACCEPT = Object.keys(EXTENSION).join(",");

/** Why a file cannot be uploaded, or null when it can. */
export function documentProblem(file: File): string | null {
  if (!EXTENSION[file.type]) return "Use a JPEG, PNG, WebP or PDF file.";
  if (file.size > MAX_BYTES) return "Use a file under 10 MB.";
  return null;
}

/** Uploads one requirement's file into the draft's folder; returns the stored path. */
export async function uploadVerificationDocument(
  requestId: string,
  requirementSlug: string,
  file: File,
): Promise<string> {
  const problem = documentProblem(file);
  if (problem) throw new Error(problem);

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Sign in to upload a document.");

  const path = `${userId}/${requestId}/${requirementSlug}-${Date.now()}.${EXTENSION[file.type]}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}
