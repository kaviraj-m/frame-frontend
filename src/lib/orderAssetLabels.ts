export type OrderAssetRow = {
  id: string;
  orderId: string;
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
    case "FINAL_IMAGE":
      return "Final image";
    default:
      return t;
  }
}

export function isExecutiveSourceAsset(t: string): boolean {
  return t === "SOURCE_PHOTO" || t === "CUSTOMER_PHOTO";
}
