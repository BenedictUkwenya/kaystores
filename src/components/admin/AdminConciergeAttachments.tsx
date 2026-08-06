import type { ConciergeAttachment } from "@/types/concierge";

type SignedAttachment = ConciergeAttachment & { url: string };

type Props = {
  attachments: SignedAttachment[];
  legacyNames?: string[];
};

export function AdminConciergeAttachments({
  attachments,
  legacyNames = [],
}: Props) {
  const legacyOnly =
    attachments.length === 0 && legacyNames.length > 0;

  if (attachments.length === 0 && legacyNames.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-kay-subtle">
        Reference files
      </p>

      {legacyOnly && (
        <p className="mt-2 text-[12px] text-amber-800">
          {legacyNames.join(", ")} — file was not stored (submitted before
          upload was enabled). Ask the client to resubmit if needed.
        </p>
      )}

      {attachments.length > 0 && (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {attachments.map((file) => {
            const isImage = file.contentType.startsWith("image/");

            return (
              <li
                key={file.path}
                className="overflow-hidden rounded-xl border border-kay-border-light bg-kay-surface"
              >
                {isImage ? (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-40 w-full object-cover"
                    />
                  </a>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-kay-surface-elevated text-[12px] text-kay-muted">
                    PDF document
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <p className="min-w-0 truncate text-[12px] text-kay-fg">
                    {file.name}
                  </p>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[12px] font-medium text-kay-gold hover:underline"
                  >
                    Open
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
