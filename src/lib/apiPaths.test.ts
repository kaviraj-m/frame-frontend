import { describe, it, expect } from "vitest";
import { apiPaths } from "./apiPaths";

describe("apiPaths", () => {
  it("encodes path segments for order and query ids", () => {
    expect(apiPaths.executiveOrderAsset("ORD-2026/x", "source")).toBe(
      "/api/executive/orders/ORD-2026%2Fx/assets/source",
    );
    expect(apiPaths.executiveQueryRemarks("qry#1")).toBe("/api/executive/queries/qry%231/remarks");
  });

  it("uses one URL pattern for executive asset link and multipart upload", () => {
    const id = "ORD-1";
    expect(apiPaths.executiveOrderAssets(id)).toBe("/api/executive/orders/ORD-1/assets");
    expect(apiPaths.executiveOrderAsset(id, "source")).toBe("/api/executive/orders/ORD-1/assets/source");
    expect(apiPaths.executiveOrderAsset(id, "customer")).toBe("/api/executive/orders/ORD-1/assets/customer");
    expect(apiPaths.executiveOrderAssetFile(id, "ast-1", "inline")).toBe(
      "/api/executive/files/ORD-1/ast-1?disposition=inline",
    );
    expect(apiPaths.executiveOrderAssetFile(id, "ast-2", "attachment")).toBe(
      "/api/executive/files/ORD-1/ast-2?disposition=attachment",
    );
    expect(apiPaths.executiveOrderAssetDelete(id, "ast-9")).toBe("/api/executive/files/ORD-1/ast-9");
  });

  it("uses designer preview-assets URL for link and multipart upload", () => {
    expect(apiPaths.designerPreviewAssets("O-2")).toBe("/api/designer/preview-assets/O-2");
  });
});
