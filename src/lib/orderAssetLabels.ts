export type OrderAssetRow = {
  id: string;
  orderId: string;
  lineItemId?: string;
  frameSize?: string;
  r2Key: string;
  assetType: string;
  isFinal: boolean;
  createdAt?: string;
};

export function fileLabelFromKey(key: string): string {
  const i = key.lastIndexOf("/");
  return i >= 0 ? key.slice(i + 1) : key;
}

export function assetTypeLabel(t: string): string {
  switch (t) {
    case "SOURCE_PHOTO":
      return "Source photo (print)";
    case "CUSTOMER_PHOTO":
      return "Customer image (frame)";
    case "DESIGN_PREVIEW":
      return "Design preview";
    case "PRINT_PROOF":
      return "Framed photo";
    case "FINAL_IMAGE":
      return "Final image";
    case "BALANCE_PAYMENT_PROOF":
      return "Balance payment proof";
    case "ADVANCE_PAYMENT_PROOF":
      return "Advance payment proof";
    default:
      return t;
  }
}

export function isExecutiveSourceAsset(t: string): boolean {
  return t === "SOURCE_PHOTO" || t === "CUSTOMER_PHOTO";
}

/** Group assets by frameSize for multi-frame orders (production, designer, etc.). */
export function groupAssetsByFrameSize(
  assets: OrderAssetRow[],
  ungroupedLabel = "Ungrouped",
): Array<[string, OrderAssetRow[]]> {
  const map = new Map<string, OrderAssetRow[]>();
  for (const a of assets) {
    const label = a.frameSize?.trim() || ungroupedLabel;
    const list = map.get(label) ?? [];
    list.push(a);
    map.set(label, list);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/** Sort frame-size groups to match order line sortOrder when available. */
export function sortFrameSizeGroups(
  groups: Array<[string, OrderAssetRow[]]>,
  lines?: { frameSize: string; sortOrder: number }[],
): Array<[string, OrderAssetRow[]]> {
  if (!lines?.length) return groups;
  const order = new Map<string, number>();
  for (const l of lines) {
    const fs = l.frameSize.trim();
    if (fs && !order.has(fs)) order.set(fs, l.sortOrder);
  }
  return [...groups].sort(([a], [b]) => {
    const oa = order.get(a) ?? 999;
    const ob = order.get(b) ?? 999;
    if (oa !== ob) return oa - ob;
    return a.localeCompare(b);
  });
}
