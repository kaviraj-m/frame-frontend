import { useEffect, useState } from "react";
import { apiBinaryGet } from "@/lib/api";
import { formatShortDateTime } from "@/lib/formatDisplay";
import { cn } from "@/lib/utils";

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

  if (failed) return <p className="text-xs text-muted-foreground">Could not load image.</p>;
  if (!src) return <p className="text-xs text-muted-foreground">Loading image…</p>;
  return (
    <img
      className="mt-2 block max-h-48 max-w-full rounded-md border border-border object-contain"
      src={src}
      alt="Remark attachment"
    />
  );
}

export function RemarkTimeline({ entries, imageUrl, emptyMessage = "No remarks yet." }: Props) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <ul className="m-0 list-none p-0">
      {entries.map((row) => (
        <li
          key={row.id || `${row.createdAt}-${row.body.slice(0, 24)}`}
          className={cn("border-b border-border py-3 last:border-b-0")}
        >
          <div className="mb-1 text-xs text-muted-foreground">{formatShortDateTime(row.createdAt)}</div>
          {row.body ? <div className="whitespace-pre-wrap text-sm">{row.body}</div> : null}
          {row.imageKey && row.id ? <RemarkImage url={imageUrl(row.id)} /> : null}
        </li>
      ))}
    </ul>
  );
}
