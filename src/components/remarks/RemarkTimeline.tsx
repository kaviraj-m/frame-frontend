import { useEffect, useState } from "react";
import { apiBinaryGet } from "../../lib/api";
import { formatShortDateTime } from "../../lib/formatDisplay";

export type RemarkEntry = {
  id?: string;
  body: string;
  imageKey?: string;
  createdAt: string;
};

type Props = {
  entries: RemarkEntry[];
  imageUrl: (remarkId: string) => string;
  emptyMessage?: string;
};

function RemarkImage({ url }: { url: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        const blob = await apiBinaryGet(url);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (failed) return <p className="small muted">Could not load image.</p>;
  if (!src) return <p className="small muted">Loading image…</p>;
  return <img className="remark-timeline__image" src={src} alt="Remark attachment" />;
}

export function RemarkTimeline({ entries, imageUrl, emptyMessage = "No remarks yet." }: Props) {
  if (entries.length === 0) {
    return <p className="small">{emptyMessage}</p>;
  }
  return (
    <ul className="remark-timeline">
      {entries.map((row) => (
        <li
          key={row.id || `${row.createdAt}-${row.body.slice(0, 24)}`}
          className="remark-timeline__item"
        >
          <div className="remark-timeline__time small">{formatShortDateTime(row.createdAt)}</div>
          {row.body ? <div className="remark-timeline__body">{row.body}</div> : null}
          {row.imageKey && row.id ? <RemarkImage url={imageUrl(row.id)} /> : null}
        </li>
      ))}
    </ul>
  );
}
