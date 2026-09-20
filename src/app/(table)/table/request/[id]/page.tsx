import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@/lib/data/home";
import {
  getTableRequestById,
} from "@/lib/table/repository";
import { TABLE_ROUTES } from "@/lib/table/catalog";
import { TableRequestChat } from "@/components/table/TableRequestChat";
import {
  TABLE_STATUS_LABELS,
  TableRequestStatusTimeline,
} from "@/components/table/TableRequestStatusTimeline";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TableRequestStatusPage({ params }: PageProps) {
  const { id } = await params;
  let request;
  try {
    request = await getTableRequestById(id);
  } catch {
    notFound();
  }
  if (!request) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 lg:px-10 lg:py-14">
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--table-muted)]">
        <Link href={TABLE_ROUTES.home} className="hover:text-[var(--table-cocoa)]">
          Kay Table
        </Link>
        <span>/</span>
        <span className="text-[var(--table-ink)]">Request</span>
      </nav>

      <div className="mt-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--table-berry)]">
          Custom request
        </p>
        <h1 className="mt-2 font-serif text-[30px] text-[var(--table-cocoa)] sm:text-[36px]">
          {request.occasion || request.category}
        </h1>
        <p className="mt-3 text-[14px] text-[var(--table-muted)]">
          Reference{" "}
          <span className="font-medium text-[var(--table-ink)]">
            {request.reference}
          </span>
          <span className="mx-2">·</span>
          {TABLE_STATUS_LABELS[request.status]}
        </p>
      </div>

      <div className="mt-8">
        <TableRequestStatusTimeline status={request.status} />
      </div>

      <dl className="mt-10 grid gap-4 rounded-2xl border border-[var(--table-line)] bg-[var(--table-paper)] p-5 text-[13px] sm:grid-cols-2">
        {request.servings && (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Servings
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">{request.servings}</dd>
          </div>
        )}
        {request.neededBy && (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Needed by
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">{request.neededBy}</dd>
          </div>
        )}
        {request.city && (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              City
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">{request.city}</dd>
          </div>
        )}
        {request.budget != null && (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Budget
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">
              {formatNaira(request.budget)}
            </dd>
          </div>
        )}
        {request.flavourNotes && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Flavours
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">{request.flavourNotes}</dd>
          </div>
        )}
        {request.styleNotes && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Style
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">{request.styleNotes}</dd>
          </div>
        )}
        {request.quoteAmount != null && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Quote
            </dt>
            <dd className="mt-1 font-medium text-[var(--table-cocoa)]">
              {formatNaira(request.quoteAmount)}
              {request.quoteNote ? ` — ${request.quoteNote}` : ""}
            </dd>
          </div>
        )}
        {request.assignedVendorName && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--table-muted)]">
              Baker
            </dt>
            <dd className="mt-1 text-[var(--table-ink)]">
              {request.assignedVendorName}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-8">
        <TableRequestChat requestId={request.id} viewerRole="customer" />
      </div>
    </div>
  );
}
