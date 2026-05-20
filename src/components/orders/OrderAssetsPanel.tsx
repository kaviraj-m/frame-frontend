import { useEffect, useRef, useState } from "react";
import { apiBinaryGet } from "../../lib/api";
import {
  assetTypeLabel,
  fileLabelFromKey,
  type OrderAssetRow,
} from "../../lib/orderAssetLabels";
import { formatShortDateTime } from "../../lib/formatDisplay";
import { ExternalLinkIcon } from "../ui/ExternalLinkIcon";

function isImageKey(key: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(key);
}

type OrderAssetsPanelProps = {
  orderId: string;
  assets: OrderAssetRow[];
  filePath: (orderId: string, assetId: string, disposition: "inline" | "attachment") => string;
  filter?: (asset: OrderAssetRow) => boolean;
  showTypeColumn?: boolean;
  showThumbnailGrid?: boolean;
  onView: (assetId: string, r2Key: string) => void;
  onDownload: (assetId: string, r2Key: string) => void;
  onDownloadAll?: () => void;
  downloadAllBusy?: boolean;
  /** Shown in Actions (first row only) — opens WhatsApp with draft message in a new tab. */
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
      className="designer-asset-thumb"
      onClick={() => onView(asset.id, asset.r2Key)}
      title={label}
    >
      {url ? (
        <img src={url} alt={label} loading="lazy" />
      ) : (
        <div
          style={{ aspectRatio: "1", display: "grid", placeItems: "center", fontSize: "0.75rem" }}
          className="muted"
        >
          {isImageKey(asset.r2Key) ? "…" : "PDF"}
        </div>
      )}
      <span className="designer-asset-thumb__label">{assetTypeLabel(asset.assetType)}</span>
    </button>
  );
}

export function OrderAssetsPanel({
  orderId,
  assets,
  filePath,
  filter,
  showTypeColumn = true,
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

  if (rows.length === 0) {
    return <p className="muted">{emptyMessage}</p>;
  }

  return (
    <>
      {showThumbnailGrid && imageRows.length > 0 ? (
        <div className="designer-asset-grid">
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
        <div className="inline-actions" style={{ marginTop: showThumbnailGrid ? 12 : 0, marginBottom: 12 }}>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            disabled={downloadAllBusy}
            onClick={onDownloadAll}
          >
            {downloadAllBusy ? (
              <>
                <span className="spinner spinner--sm" aria-hidden /> Downloading…
              </>
            ) : (
              "Download all"
            )}
          </button>
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {showTypeColumn ? <th>Type</th> : null}
              <th>File</th>
              <th>Uploaded</th>
              <th className="td-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, rowIndex) => (
              <tr key={a.id}>
                {showTypeColumn ? <td>{assetTypeLabel(a.assetType)}</td> : null}
                <td className="td-mono">{fileLabelFromKey(a.r2Key)}</td>
                <td className="date-cell">{a.createdAt ? formatShortDateTime(a.createdAt) : "—"}</td>
                <td className="td-actions">
                  <div className="inline-actions td-actions-stack">
                    {onWhatsApp && rowIndex === 0 ? (
                      <button
                        type="button"
                        className="btn btn--sm btn--whatsapp-action"
                        disabled={whatsappBusy || whatsappDisabled}
                        title={whatsappTitle}
                        onClick={onWhatsApp}
                      >
                        {whatsappBusy ? (
                          <>
                            <span className="spinner spinner--sm" aria-hidden />
                            Opening…
                          </>
                        ) : (
                          <>
                            <ExternalLinkIcon />
                            WhatsApp
                          </>
                        )}
                      </button>
                    ) : null}
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => onView(a.id, a.r2Key)}>
                      View
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => onDownload(a.id, a.r2Key)}
                    >
                      Download
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <p className="total-info">
            <strong>{rows.length}</strong> file{rows.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </>
  );
}
