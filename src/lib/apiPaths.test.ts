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
      "/api/executive/orders/ORD-1/files/ast-1?disposition=inline",
    );
    expect(apiPaths.executiveOrderAssetFile(id, "ast-2", "attachment")).toBe(
      "/api/executive/orders/ORD-1/files/ast-2?disposition=attachment",
    );
    expect(apiPaths.executiveOrderAssetDelete(id, "ast-9")).toBe(
      "/api/executive/orders/ORD-1/files/ast-9",
    );
  });

  it("uses admin fulfillment URLs", () => {
    const id = "O-ADM";
    expect(apiPaths.adminOrder(id)).toBe("/api/admin/orders/O-ADM");
    expect(apiPaths.adminOrderPrintDone(id)).toBe("/api/admin/orders/O-ADM/print-done");
    expect(apiPaths.adminOrderBalancePayment(id)).toBe("/api/admin/orders/O-ADM/balance-payment");
    expect(apiPaths.adminOrderBalancePaid(id)).toBe("/api/admin/orders/O-ADM/balance-paid");
    expect(apiPaths.adminOrderDispatch(id)).toBe("/api/admin/orders/O-ADM/dispatch");
    expect(apiPaths.adminOrderComplete(id)).toBe("/api/admin/orders/O-ADM/complete");
  });

  it("uses designer order work URLs", () => {
    const id = "O-2";
    expect(apiPaths.designerPreviewAssets(id)).toBe("/api/designer/orders/O-2/preview-assets");
    expect(apiPaths.designerOrder(id)).toBe("/api/designer/orders/O-2");
    expect(apiPaths.designerOrderAssets(id)).toBe("/api/designer/orders/O-2/assets");
    expect(apiPaths.designerOrderAssetFile(id, "ast-1", "inline")).toBe(
      "/api/designer/orders/O-2/files/ast-1?disposition=inline",
    );
    expect(apiPaths.designerTakeOrder(id)).toBe("/api/designer/orders/O-2/take");
    expect(apiPaths.designerOrderDecision(id)).toBe("/api/designer/orders/O-2/decision");
  });
});
