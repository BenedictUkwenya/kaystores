"use client";

import { TableFooter } from "@/components/table/TableFooter";
import { TableHeader } from "@/components/table/TableHeader";
import "@/components/table/table-experience.css";

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="table-experience force-motion min-h-screen">
      <TableHeader />
      <main>{children}</main>
      <TableFooter />
    </div>
  );
}
