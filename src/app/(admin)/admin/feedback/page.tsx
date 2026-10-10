import { requireAdmin } from "@/lib/auth/roles";
import { ADMIN_NAV, DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FeedbackBoard } from "@/components/feedback/FeedbackBoard";

export default async function AdminFeedbackPage() {
  const auth = await requireAdmin();
  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Work"
      title="Feedback"
      description="Ideas, bugs, tips, and praise from the shop. Set a status and reply in public."
      badge="Admin"
    >
      <FeedbackBoard userId={auth.userId} isStaff embedded />
    </DashboardLayout>
  );
}
