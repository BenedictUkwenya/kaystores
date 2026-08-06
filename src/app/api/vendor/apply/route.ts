import { apiErrorResponse, getSessionUser } from "@/lib/auth/roles";
import { submitVendorApplication } from "@/lib/vendors/repository";
import {
  notifyVendorApplication,
  notifyVendorApproved,
} from "@/lib/email/vendor";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return Response.json({ error: "Sign in to apply." }, { status: 401 });
    }

    const body = await request.json();
    const vendor = await submitVendorApplication({
      userId: user.id,
      businessName: String(body.businessName ?? "").trim(),
      contactName: String(body.contactName ?? "").trim(),
      contactEmail: String(body.contactEmail ?? user.email ?? "").trim(),
      contactPhone: String(body.contactPhone ?? "").trim(),
      catalogDescription: String(body.catalogDescription ?? "").trim(),
      nin: body.nin ? String(body.nin) : undefined,
      inviteToken: body.inviteToken ? String(body.inviteToken) : undefined,
    });

    if (vendor.status === "approved") {
      void notifyVendorApproved({
        contactName: vendor.contactName,
        contactEmail: vendor.contactEmail,
        businessName: vendor.businessName,
      });
    } else {
      void notifyVendorApplication({
        contactName: vendor.contactName,
        contactEmail: vendor.contactEmail,
        businessName: vendor.businessName,
      });
    }

    return Response.json({ vendor });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
