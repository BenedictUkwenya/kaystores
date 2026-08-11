/** Helpers for Kay Reveal media — direct-to-storage uploads. */

export async function uploadRevealFileDirect(input: {
  orderId: string;
  buyerEmail: string;
  file: File;
  kind: "video" | "photo";
}): Promise<string> {
  const prep = await fetch(`/api/orders/${input.orderId}/reveal/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyerEmail: input.buyerEmail,
      kind: input.kind,
      fileName: input.file.name,
      contentType: input.file.type,
      size: input.file.size,
    }),
  });
  const data = (await prep.json()) as {
    path?: string;
    token?: string;
    error?: string;
  };
  if (!prep.ok || !data.path || !data.token) {
    throw new Error(data.error || "Could not prepare upload.");
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("gift-reveal-media")
    .uploadToSignedUrl(data.path, data.token, input.file, {
      contentType: input.file.type || undefined,
    });

  if (error) throw new Error(error.message || `Could not upload ${input.kind}.`);
  return data.path;
}
