import type { Metadata } from "next";
import { TableShell } from "@/components/table/TableShell";

export const metadata: Metadata = {
  title: "Kay Kitchen — Edible gifts",
  description:
    "Cakes, chocolates, gourmet hampers, and custom celebration food from Kay Stores.",
};

export default function TableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TableShell>{children}</TableShell>;
}
