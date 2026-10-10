import { getAuthContext } from "@/lib/auth/roles";
import { FeedbackBoard } from "@/components/feedback/FeedbackBoard";

export const metadata = {
  title: "Feedback — Kay Stores",
};

export default async function FeedbackPage() {
  const auth = await getAuthContext();
  return (
    <FeedbackBoard
      userId={auth?.userId ?? null}
      isStaff={auth?.profile.role === "admin"}
    />
  );
}
