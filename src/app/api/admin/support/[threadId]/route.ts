import {
  apiErrorResponse,
  requireAdmin,
  AuthError,
} from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifySupportMessage } from "@/lib/email/support";
import {
  closeSupportThread,
  getThreadById,
  insertSupportMessage,
  listMessagesForThread,
} from "@/lib/support/repository";
import {
  signSupportImage,
  signSupportMessages,
  uploadSupportImage,
} from "@/lib/storage/support-attachments";

type Params = { params: Promise<{ threadId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { threadId } = await params;
    const thread = await getThreadById(threadId);
    if (!thread) throw new AuthError("Thread not found", 404);

    const messages = await signSupportMessages(
      await listMessagesForThread(thread.id),
    );

    return Response.json({ thread, messages });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireAdmin();
    const { threadId } = await params;
    const thread = await getThreadById(threadId);
    if (!thread) throw new AuthError("Thread not found", 404);

    const contentType = request.headers.get("content-type") ?? "";
    let body: string | null = null;
    let image: File | null = null;
    let close = false;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const rawBody = form.get("body");
      body =
        typeof rawBody === "string" && rawBody.trim()
          ? rawBody.trim()
          : null;
      const file = form.get("image");
      if (file instanceof File && file.size > 0) image = file;
      close = form.get("close") === "true" || form.get("close") === "1";
    } else {
      const json = (await request.json()) as {
        body?: string;
        close?: boolean;
      };
      body =
        typeof json.body === "string" && json.body.trim()
          ? json.body.trim()
          : null;
      close = Boolean(json.close);
    }

    if (close && !body && !image) {
      await closeSupportThread(thread.id);
      return Response.json({ thread: { ...thread, status: "closed" } });
    }

    if (!body && !image) {
      return Response.json(
        { error: "Message text or image is required." },
        { status: 400 },
      );
    }

    const imagePath = image
      ? await uploadSupportImage(ctx.userId, thread.id, image)
      : null;

    const message = await insertSupportMessage({
      threadId: thread.id,
      senderId: ctx.userId,
      senderRole: "admin",
      body,
      imagePath,
    });

    if (close) await closeSupportThread(thread.id);

    const admin = createAdminClient();
    let userEmail: string | undefined;
    if (admin) {
      const { data } = await admin.auth.admin.getUserById(thread.userId);
      userEmail = data?.user?.email ?? undefined;
    }

    if (userEmail) {
      void notifySupportMessage({
        audience: "user",
        to: userEmail,
        preview: body || "[Image attached]",
        senderName: "Kay Support",
        threadId: thread.id,
      }).catch((err) => console.error("[support] email failed:", err));
    }

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
