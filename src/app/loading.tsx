import { KayLoader } from "@/components/brand/KayLoader";

/** Quiet route hold — never compete with the cinematic splash. */
export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-1 items-center justify-center bg-kay-bg">
      <KayLoader size="md" />
    </div>
  );
}
