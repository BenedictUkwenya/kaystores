import { sendKayEmail } from "@/lib/email/send";
import { getSiteUrl } from "@/lib/site";

export async function notifyVendorApplication(vendor: {
  contactName: string;
  contactEmail: string;
  businessName: string;
}) {
  await sendKayEmail({
    type: "vendor_application_received",
    appUrl: getSiteUrl(),
    vendor,
  });
}

export async function notifyVendorApproved(vendor: {
  contactName: string;
  contactEmail: string;
  businessName: string;
}) {
  await sendKayEmail({
    type: "vendor_approved",
    appUrl: getSiteUrl(),
    vendor,
  });
}

export async function notifyVendorRejected(vendor: {
  contactName: string;
  contactEmail: string;
  businessName: string;
}) {
  await sendKayEmail({
    type: "vendor_application_rejected",
    appUrl: getSiteUrl(),
    vendor,
  });
}

export async function notifyProductReview(
  vendor: { contactName: string; contactEmail: string; businessName: string },
  productName: string,
  approved: boolean,
  rejectionReason?: string,
) {
  await sendKayEmail({
    type: approved ? "vendor_product_approved" : "vendor_product_rejected",
    appUrl: getSiteUrl(),
    vendor,
    productName,
    rejectionReason,
  });
}

export async function notifyWithdrawalUpdate(
  vendor: { contactName: string; contactEmail: string; businessName: string },
  amount: number,
  status: string,
) {
  await sendKayEmail({
    type: "vendor_withdrawal_update",
    appUrl: getSiteUrl(),
    vendor,
    withdrawalAmount: amount,
    withdrawalStatus: status,
  });
}
