import {
  apiErrorResponse,
  getAuthContext,
  AuthError,
} from "@/lib/auth/roles";
import { notifySupportMessage } from "@/lib/email/support";
import {
  getOrCreateOpenThread,
  insertSupportMessage,
} from "@/lib/support/repository";
import {
  signSupportImage,
  uploadSupportImage,
} from "@/lib/storage/support-attachments";
import type { SupportSenderRole } from "@/types/support";

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) throw new AuthError("Unauthorized", 401);

    const contentType = request.headers.get("content-type") ?? "";
    let body: string | null = null;
    let image: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const rawBody = form.get("body");
      body =
        typeof rawBody === "string" && rawBody.trim()
          ? rawBody.trim()
          : null;
      const file = form.get("image");
      if (file instanceof File && file.size > 0) image = file;
    } else {
      const json = (await request.json()) as { body?: string };
      body = typeof json.body === "string" && json.body.trim() ? json.body.trim() : null;
    }

    if (!body && !image) {
      return Response.json(
        { error: "Message text or image is required." },
        { status: 400 },
      );
    }

    const thread = await getOrCreateOpenThread(ctx.userId);
    const imagePath = image
      ? await uploadSupportImage(ctx.userId, thread.id, image)
      : null;

    const senderRole: SupportSenderRole =
      ctx.profile.role === "vendor"
        ? "vendor"
        : ctx.profile.role === "admin"
          ? "admin"
          : "customer";

    const message = await insertSupportMessage({
      threadId: thread.id,
      senderId: ctx.userId,
      senderRole,
      body,
      imagePath,
    });

    const preview = body || "[Image attached]";
    const senderName = ctx.profile.fullName || ctx.email;

    void notifySupportMessage({
      audience: "team",
      preview,
      senderName: senderName ?? undefined,
      threadId: thread.id,
    }).catch((err) => console.error("[support] email failed:", err));

    return Response.json({
      message: {
        ...message,
        imageUrl: await signSupportImage(message.imagePath),
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
