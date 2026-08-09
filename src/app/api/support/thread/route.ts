import {
  apiErrorResponse,
  getAuthContext,
  AuthError,
} from "@/lib/auth/roles";
import {
  getOpenThreadForUser,
  listMessagesForThread,
} from "@/lib/support/repository";
import { signSupportMessages } from "@/lib/storage/support-attachments";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) throw new AuthError("Unauthorized", 401);

    const thread = await getOpenThreadForUser(ctx.userId);
    const messages = thread
      ? await signSupportMessages(await listMessagesForThread(thread.id))
      : [];

    return Response.json({ thread, messages });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
