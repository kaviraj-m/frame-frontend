import { describe, it, expect } from "vitest";
import { apiPaths } from "./apiPaths";

describe("apiPaths", () => {
  it("encodes path segments for order and query ids", () => {
    expect(apiPaths.executiveOrderAsset("ORD-2026/x", "source")).toBe(
      "/api/executive/orders/ORD-2026%2Fx/assets/source",
    );
    expect(apiPaths.executiveQueryRemarks("qry#1")).toBe("/api/executive/queries/qry%231/remarks");
  });

  it("uses executive order WhatsApp URL", () => {
    expect(apiPaths.executiveOrderWhatsApp("ORD-2026/x")).toBe(
      "/api/executive/orders/ORD-2026%2Fx/whatsapp",
    );
  });

  it("uses one URL pattern for executive asset link and multipart upload", () => {
    const id = "ORD-1";
    expect(apiPaths.executiveOrderAssets(id)).toBe("/api/executive/orders/ORD-1/assets");
    expect(apiPaths.executiveOrderAsset(id, "source")).toBe("/api/executive/orders/ORD-1/assets/source");
    expect(apiPaths.executiveOrderAsset(id, "customer")).toBe("/api/executive/orders/ORD-1/assets/customer");
    expect(apiPaths.executiveOrderLineAsset(id, "oli-1", "customer")).toBe(
      "/api/executive/orders/ORD-1/line-items/oli-1/assets/customer",
    );
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

  it("uses executive fulfillment and feature URLs", () => {
    const id = "O-EX";
    expect(apiPaths.executiveFeatures).toBe("/api/executive/features");
    expect(apiPaths.executiveProductionOrders).toBe("/api/executive/production-orders");
    expect(apiPaths.adminExecutiveFeatures).toBe("/api/admin/settings/executive-features");
    expect(apiPaths.executiveFulfillmentOrder(id)).toBe("/api/executive/orders/O-EX");
    expect(apiPaths.executiveOrderPrintImageUpload(id)).toBe("/api/executive/orders/O-EX/print-image");
    expect(apiPaths.executiveOrderPrintDone(id)).toBe("/api/executive/orders/O-EX/print-done");
    expect(apiPaths.executiveOrderDispatch(id)).toBe("/api/executive/orders/O-EX/dispatch");
    expect(apiPaths.executiveOrderWhatsAppDispatch(id, "TRK")).toBe(
      "/api/executive/orders/O-EX/whatsapp-dispatch?trackingNumber=TRK",
    );
    expect(apiPaths.executiveOrderPrintWhatsApp(id)).toBe("/api/executive/orders/O-EX/whatsapp-print");
  });

  it("uses admin fulfillment URLs", () => {
    const id = "O-ADM";
    expect(apiPaths.adminOrder(id)).toBe("/api/admin/orders/O-ADM");
    expect(apiPaths.adminOrderDetail(id)).toBe("/api/admin/orders/O-ADM/detail");
    expect(apiPaths.adminQueryRemarkImage("Q-1", "rm-1")).toBe(
      "/api/admin/queries/Q-1/remarks/rm-1/file?disposition=inline",
    );
    expect(apiPaths.adminPreviewRemarkImage(id, "dpr-1")).toBe(
      "/api/admin/orders/O-ADM/preview-remarks/dpr-1/file?disposition=inline",
    );
    expect(apiPaths.adminOrderPrintImage(id, "inline")).toBe(
      "/api/admin/orders/O-ADM/print-image?disposition=inline",
    );
    expect(apiPaths.adminOrderPrintImageUpload(id)).toBe("/api/admin/orders/O-ADM/print-image");
    expect(apiPaths.adminLinePrintImageUpload(id, "li-1")).toBe(
      "/api/admin/orders/O-ADM/line-items/li-1/print-image",
    );
    expect(apiPaths.adminOrderPrintDone(id)).toBe("/api/admin/orders/O-ADM/print-done");
    expect(apiPaths.adminOrderBalancePayment(id)).toBe("/api/admin/orders/O-ADM/balance-payment");
    expect(apiPaths.adminOrderBalancePaid(id)).toBe("/api/admin/orders/O-ADM/balance-paid");
    expect(apiPaths.adminOrderSaveTracking(id)).toBe("/api/admin/orders/O-ADM/tracking");
    expect(apiPaths.adminOrderDispatch(id)).toBe("/api/admin/orders/O-ADM/dispatch");
    expect(apiPaths.adminOrderWhatsApp(id)).toBe("/api/admin/orders/O-ADM/whatsapp");
    expect(apiPaths.adminOrderWhatsApp(id, "TRK-1")).toBe(
      "/api/admin/orders/O-ADM/whatsapp?trackingNumber=TRK-1",
    );
    expect(apiPaths.adminWhatsAppPrintDraft).toBe("/api/admin/whatsapp-print-draft");
    expect(apiPaths.adminOrderPrintWhatsApp(id)).toBe("/api/admin/orders/O-ADM/whatsapp-print");
    expect(apiPaths.adminOrderComplete(id)).toBe("/api/admin/orders/O-ADM/complete");
  });

  it("uses designer order work URLs", () => {
    const id = "O-2";
    expect(apiPaths.designerPreviewAssets(id)).toBe("/api/designer/orders/O-2/preview-assets");
    expect(apiPaths.designerLinePreviewAssets(id, "li-1")).toBe(
      "/api/designer/orders/O-2/line-items/li-1/preview-assets",
    );
    expect(apiPaths.designerOrder(id)).toBe("/api/designer/orders/O-2");
    expect(apiPaths.designerOrderAssets(id)).toBe("/api/designer/orders/O-2/assets");
    expect(apiPaths.designerOrderAssetFile(id, "ast-1", "inline")).toBe(
      "/api/designer/orders/O-2/files/ast-1?disposition=inline",
    );
    expect(apiPaths.designerTakeOrder(id)).toBe("/api/designer/orders/O-2/take");
    expect(apiPaths.designerOrderDecision(id)).toBe("/api/designer/orders/O-2/decision");
  });
});
