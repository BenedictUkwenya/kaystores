import type { ConciergeAttachment } from "@/types/concierge";

type SignedAttachment = ConciergeAttachment & { url: string };

type Props = {
  attachments: SignedAttachment[];
  legacyNames?: string[];
};

export function VendorReferenceAttachments({ attachments, legacyNames = [] }: Props) {
  if (attachments.length === 0 && legacyNames.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-kay-subtle">
        Client reference files
      </p>
      {attachments.length > 0 ? (
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {attachments.map((file) => (
            <li key={file.path}>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-kay-border-light bg-kay-surface p-2 text-[11px] text-kay-muted hover:border-kay-gold"
              >
                {file.contentType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.url}
                    alt={file.name}
                    className="mb-1 h-20 w-full rounded object-cover"
                  />
                ) : null}
                <span className="line-clamp-2">{file.name}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[12px] text-kay-subtle">{legacyNames.join(", ")}</p>
      )}
    </div>
  );
}
