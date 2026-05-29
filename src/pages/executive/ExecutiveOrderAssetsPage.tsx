import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilePickField } from "@/components/ui/FilePickField";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { api, apiBinaryGet, apiUpload } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { formatShortDateTime } from "@/lib/formatDisplay";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderBand,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

type OrderAssetRow = {
  id: string;
  orderId: string;
  r2Key: string;
  assetType: string;
  isFinal: boolean;
  createdAt?: string;
};

function fileLabelFromKey(key: string): string {
  const i = key.lastIndexOf("/");
  return i >= 0 ? key.slice(i + 1) : key;
}

function assetTypeLabel(t: string): string {
  switch (t) {
    case "SOURCE_PHOTO":
      return "Source photo (print)";
    case "CUSTOMER_PHOTO":
      return "Customer image (frame)";
    case "DESIGN_PREVIEW":
      return "Design preview";
    case "FINAL_IMAGE":
      return "Final image";
    default:
      return t;
  }
}

export function ExecutiveOrderAssetsPage() {
  const { orderId: orderIdParam } = useParams();
  const orderId = orderIdParam ? decodeURIComponent(orderIdParam) : "";
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [assets, setAssets] = useState<OrderAssetRow[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
  const [imagePreviewLoading, setImagePreviewLoading] = useState(false);
  const imagePreviewUrlRef = useRef<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const { confirmAction, dialogProps } = useConfirmDialog();

  const closeImagePreview = useCallback(() => {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
      imagePreviewUrlRef.current = null;
    }
    setImagePreview(null);
    setImagePreviewLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
    };
  }, []);

  const loadAssets = useCallback(async () => {
    if (!orderId.trim()) return;
    setError("");
    try {
      const list = await api<OrderAssetRow[]>(apiPaths.executiveOrderAssets(orderId));
      setAssets(list);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [orderId]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  function canExecutiveDeleteAsset(assetType: string): boolean {
    return assetType === "SOURCE_PHOTO" || assetType === "CUSTOMER_PHOTO";
  }

  async function viewAsset(assetId: string, r2Key: string) {
    closeImagePreview();
    setError("");
    setImagePreviewLoading(true);
    try {
      const path = apiPaths.executiveOrderAssetFile(orderId, assetId, "inline");
      const blob = await apiBinaryGet(path);
      const url = URL.createObjectURL(blob);
      imagePreviewUrlRef.current = url;
      setImagePreview({ url, title: fileLabelFromKey(r2Key) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImagePreviewLoading(false);
    }
  }

  async function downloadAsset(assetId: string, r2Key: string) {
    setError("");
    try {
      const path = apiPaths.executiveOrderAssetFile(orderId, assetId, "attachment");
      const blob = await apiBinaryGet(path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileLabelFromKey(r2Key);
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function deleteAsset(assetId: string, assetType: string) {
    if (!canExecutiveDeleteAsset(assetType)) return;
    confirmAction(
      {
        title: "Delete file",
        message: "Delete this file from the order and from storage? This cannot be undone.",
        confirmLabel: "Delete file",
        variant: "danger",
      },
      async () => {
        setError("");
        setStatus("");
        setDeletingAssetId(assetId);
        try {
          await api(apiPaths.executiveOrderAssetDelete(orderId, assetId), { method: "DELETE" });
          setStatus("File removed.");
          await loadAssets();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setDeletingAssetId(null);
        }
      },
    );
  }

  function clearSourceFileSelection() {
    setSourceFiles([]);
  }

  async function uploadSourceFile(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    const files = sourceFiles;
    if (!orderId.trim() || files.length === 0) {
      setError("Choose one or more images to upload.");
      return;
    }
    setUploadBusy(true);
    setUploadProgress({ current: 0, total: files.length });
    const failures: string[] = [];
    let ok = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        const file = files[i];
        try {
          const fd = new FormData();
          fd.append("file", file);
          await apiUpload(apiPaths.executiveOrderAsset(orderId, "source"), fd);
          ok++;
        } catch (err) {
          failures.push(`${file.name}: ${(err as Error).message}`);
        }
      }
    } finally {
      setUploadBusy(false);
      setUploadProgress(null);
    }
    await loadAssets();
    if (ok > 0) {
      setStatus(
        failures.length === 0
          ? `Uploaded ${ok} image${ok === 1 ? "" : "s"} successfully.`
          : `Uploaded ${ok} of ${files.length}. Some could not be uploaded — see the error below.`,
      );
    }
    if (failures.length > 0) {
      setError(failures.join(" "));
    }
    if (ok === files.length) {
      clearSourceFileSelection();
    }
  }

  if (!orderId) {
    return (
      <Card>
        <p className="text-destructive">Missing order id.</p>
        <Link to="/executive/orders" className="text-sm text-primary hover:underline">
          ← Orders
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <nav className="breadcrumb text-sm">
        <Link to="/executive/orders">Orders</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="font-mono text-xs">{orderId}</span>
        <span className="breadcrumb-sep">/</span>
        <span>Source photos</span>
      </nav>
      <PageHeader
        kicker="Print files"
        title="Source photos"
        description="Everything the lab needs before design starts. Files already on this order (including the customer frame image from confirm) appear below. Add more from your computer."
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={() => loadAssets()}>
            Refresh list
          </Button>
        }
      />
      {status && (
        <Alert variant="success" role="status">
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <h3 className="text-lg font-semibold mb-2">Files on this order</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Framing images from confirm order show as &quot;Customer image (frame)&quot; (there may be several). Source uploads show as &quot;Source photo (print)&quot;.
        </p>
        <div className="w-full">
          <Table stickyFirstColumn>
            <TableHeaderBand>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Storage key</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeaderBand>
            <TableBody>
              {assets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-semibold">{assetTypeLabel(a.assetType)}</TableCell>
                  <TableCell className="font-mono text-xs">{a.r2Key}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatShortDateTime(a.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => viewAsset(a.id, a.r2Key)}>
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadAsset(a.id, a.r2Key)}
                      >
                        Download
                      </Button>
                      {canExecutiveDeleteAsset(a.assetType) && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deletingAssetId !== null}
                          onClick={() => deleteAsset(a.id, a.assetType)}
                        >
                          {deletingAssetId === a.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                              Deleting…
                            </>
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No files yet. Confirm the order with a customer image, or upload a source photo below.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground mt-3">
            Showing <strong>{assets.length}</strong> file{assets.length === 1 ? "" : "s"}
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Upload from computer</h3>
        <form className="space-y-4" onSubmit={uploadSourceFile} aria-busy={uploadBusy}>
          <FilePickField
            label="Source photos"
            hint="JPEG / PNG / WebP, up to about 32MB each. Pick several at once, or use Choose images again to add more — previous picks stay in the list."
            multiple
            chooseLabel="Choose images"
            files={sourceFiles}
            onFilesChange={setSourceFiles}
            disabled={uploadBusy}
          />
          <Button type="submit" className="w-full" disabled={uploadBusy || sourceFiles.length === 0}>
            {uploadBusy && uploadProgress ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Uploading {uploadProgress.current} / {uploadProgress.total}…
              </>
            ) : (
              `Upload${sourceFiles.length > 1 ? ` ${sourceFiles.length} images` : sourceFiles.length === 1 ? " image" : ""}`
            )}
          </Button>
        </form>
      </Card>
      <Link to="/executive/orders" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to orders
      </Link>

      <Dialog
        open={imagePreviewLoading || !!imagePreview}
        onOpenChange={(v) => !v && closeImagePreview()}
      >
        <DialogContent className="sm:max-w-3xl" onPointerDownOutside={closeImagePreview}>
          <DialogHeader>
            <DialogTitle className="font-mono text-sm truncate">
              {imagePreview?.title ?? "Loading preview…"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[200px]">
            {imagePreviewLoading && <p className="text-sm text-muted-foreground">Loading image…</p>}
            {imagePreview && (
              <img
                src={imagePreview.url}
                alt={imagePreview.title}
                className="max-h-[70vh] max-w-full object-contain rounded-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
