import { getAuthContext } from "@/lib/auth/roles";
import { TableRequestForm } from "@/components/table/TableRequestForm";

export const metadata = {
  title: "Request a custom cake — Kay Table",
};

export default async function TableRequestPage() {
  const ctx = await getAuthContext();

  return (
    <div className="table-paper-grain px-4 py-12 lg:px-10 lg:py-16">
      <TableRequestForm
        defaultContact={{
          name: ctx?.profile.fullName ?? undefined,
          email: ctx?.email,
          phone: ctx?.profile.phone ?? undefined,
        }}
      />
    </div>
  );
}
