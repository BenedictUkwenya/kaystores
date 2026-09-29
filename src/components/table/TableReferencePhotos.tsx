/** Client's inspiration photos (signed URLs). */
export function TableReferencePhotos({
  urls,
  className = "",
}: {
  urls: string[];
  className?: string;
}) {
  if (urls.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {urls.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-24 w-24 overflow-hidden rounded-xl border border-kay-border-light"
          aria-label={`Open inspiration photo ${i + 1}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}
