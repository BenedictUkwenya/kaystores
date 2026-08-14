import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** Hide from auto-generated mobile card rows */
  hideOnMobile?: boolean;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  keyFn: (row: T) => string;
  emptyMessage?: string;
};

export function DataTable<T>({
  columns,
  rows,
  keyFn,
  emptyMessage = "Nothing here yet.",
}: Props<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-kay-border bg-kay-surface-elevated px-4 py-14 text-center sm:px-6">
        <p className="text-[14px] text-kay-muted">{emptyMessage}</p>
      </div>
    );
  }

  const mobileColumns = columns.filter((col) => !col.hideOnMobile);

  return (
    <>
      <ul className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <li
            key={keyFn(row)}
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-4 shadow-[var(--kay-card-shadow)]"
          >
            <dl className="space-y-2.5">
              {mobileColumns.map((col) => (
                <div
                  key={col.key}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
                >
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-kay-subtle">
                    {col.header}
                  </dt>
                  <dd className="text-right text-[13px] text-kay-fg">
                    {col.render(row)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-[24px] border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)] lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-kay-border-light bg-[#111111]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55 ${col.className ?? ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-kay-border-light">
              {rows.map((row) => (
                <tr
                  key={keyFn(row)}
                  className="transition-colors hover:bg-kay-gold-light/15"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-4 text-kay-fg ${col.className ?? ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
