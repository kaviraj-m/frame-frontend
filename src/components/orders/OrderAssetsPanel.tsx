import { useEffect, useRef, useState } from "react";
import { apiBinaryGet } from "@/lib/api";
import {
  assetTypeLabel,
  fileLabelFromKey,
  type OrderAssetRow,
} from "@/lib/orderAssetLabels";
import { formatShortDateTime } from "@/lib/formatDisplay";
import { ExternalLinkIcon } from "@/components/ui/ExternalLinkIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderBand,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const WHATSAPP_BTN =
  "border border-[rgba(37,211,102,0.55)] bg-[rgba(37,211,102,0.14)] text-[#d4f5e0] font-semibold hover:border-[rgba(37,211,102,0.85)] hover:bg-[rgba(37,211,102,0.22)] hover:text-[#f0fff5]";

function isImageKey(key: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(key);
}

type OrderAssetsPanelProps = {
  orderId: string;
  assets: OrderAssetRow[];
  filePath: (orderId: string, assetId: string, disposition: "inline" | "attachment") => string;
  filter?: (asset: OrderAssetRow) => boolean;
  showTypeColumn?: boolean;
  showFrameSizeColumn?: boolean;
  showThumbnailGrid?: boolean;
  onView: (assetId: string, r2Key: string) => void;
  onDownload: (assetId: string, r2Key: string) => void;
  onDownloadAll?: () => void;
  downloadAllBusy?: boolean;
  onWhatsApp?: () => void;
  whatsappBusy?: boolean;
  whatsappDisabled?: boolean;
  whatsappTitle?: string;
  emptyMessage?: string;
};

function AssetThumbnail({
  orderId,
  asset,
  filePath,
  onView,
}: {
  orderId: string;
  asset: OrderAssetRow;
  filePath: OrderAssetsPanelProps["filePath"];
  onView: (assetId: string, r2Key: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isImageKey(asset.r2Key)) return;
    let cancelled = false;
    apiBinaryGet(filePath(orderId, asset.id, "inline"))
      .then((blob) => {
        if (cancelled) return;
        const u = URL.createObjectURL(blob);
        urlRef.current = u;
        setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [orderId, asset.id, asset.r2Key, filePath]);

  const label = fileLabelFromKey(asset.r2Key);

  return (
    <button
      type="button"
      className="flex flex-col gap-1 rounded-md border border-border overflow-hidden hover:border-primary/50 transition-colors text-left"
      onClick={() => onView(asset.id, asset.r2Key)}
      title={label}
    >
      {url ? (
        <img src={url} alt={label} loading="lazy" className="aspect-square object-cover w-full" />
      ) : (
        <div className="aspect-square grid place-items-center text-xs text-muted-foreground bg-muted/30">
          {isImageKey(asset.r2Key) ? "…" : "PDF"}
        </div>
      )}
      <span className="text-[0.65rem] px-2 pb-2 text-muted-foreground truncate">{assetTypeLabel(asset.assetType)}</span>
    </button>
  );
}

export function OrderAssetsPanel({
  orderId,
  assets,
  filePath,
  filter,
  showTypeColumn = true,
  showFrameSizeColumn = false,
  showThumbnailGrid = false,
  onView,
  onDownload,
  onDownloadAll,
  downloadAllBusy,
  onWhatsApp,
  whatsappBusy = false,
  whatsappDisabled = false,
  whatsappTitle = "Open WhatsApp in a new tab",
  emptyMessage = "No files yet.",
}: OrderAssetsPanelProps) {
  const rows = filter ? assets.filter(filter) : assets;
  const imageRows = rows.filter((a) => isImageKey(a.r2Key));
  const showFrameSize =
    showFrameSizeColumn || rows.some((a) => Boolean(a.frameSize?.trim()));

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <>
      {showThumbnailGrid && imageRows.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
          {imageRows.map((a) => (
            <AssetThumbnail
              key={a.id}
              orderId={orderId}
              asset={a}
              filePath={filePath}
              onView={onView}
            />
          ))}
        </div>
      ) : null}

      {onDownloadAll && rows.length > 0 ? (
        <div className={cn("flex gap-2", showThumbnailGrid ? "mt-3 mb-3" : "mb-3")}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={downloadAllBusy}
            onClick={onDownloadAll}
          >
            {downloadAllBusy ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                Downloading…
              </>
            ) : (
              "Download all"
            )}
          </Button>
        </div>
      ) : null}

      <div className="overflow-auto w-full">
        <Table>
          <TableHeaderBand>
            <TableRow>
              {showTypeColumn ? <TableHead>Type</TableHead> : null}
              {showFrameSize ? <TableHead>Frame size</TableHead> : null}
              <TableHead>File</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeaderBand>
          <TableBody>
            {rows.map((a, rowIndex) => (
              <TableRow key={a.id}>
                {showTypeColumn ? <TableCell>{assetTypeLabel(a.assetType)}</TableCell> : null}
                {showFrameSize ? (
                  <TableCell className="whitespace-nowrap text-xs">
                    {a.frameSize?.trim() ? (
                      <Badge variant="secondary" className="text-xs font-normal">
                        {a.frameSize.trim()}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                ) : null}
                <TableCell className="font-mono text-xs">{fileLabelFromKey(a.r2Key)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {a.createdAt ? formatShortDateTime(a.createdAt) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-2">
                    {onWhatsApp && rowIndex === 0 ? (
                      <Button
                        type="button"
                        size="sm"
                        className={cn(WHATSAPP_BTN)}
                        disabled={whatsappBusy || whatsappDisabled}
                        title={whatsappTitle}
                        onClick={onWhatsApp}
                      >
                        {whatsappBusy ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                            Opening…
                          </>
                        ) : (
                          <>
                            <ExternalLinkIcon />
                            WhatsApp
                          </>
                        )}
                      </Button>
                    ) : null}
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => onView(a.id, a.r2Key)}>
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onDownload(a.id, a.r2Key)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-3">
          <strong>{rows.length}</strong> file{rows.length === 1 ? "" : "s"}
        </p>
      </div>
    </>
  );
}
