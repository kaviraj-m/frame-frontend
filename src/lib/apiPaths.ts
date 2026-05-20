/**
 * Canonical REST paths for the kaspx backend. Use these from pages so URLs stay
 * aligned with `backend/internal/app/server.go`.
 */

const enc = (s: string) => encodeURIComponent(s);

export const apiPaths = {
  authLogin: "/api/auth/login",
  authRefresh: "/api/auth/refresh",

  orders: "/api/orders",

  /** Active frame sizes and list prices (executive catalogue). */
  executivePricing: "/api/executive/pricing",
  executiveQueries: "/api/executive/queries",
  executiveQueryDetail: (queryId: string) => `/api/executive/queries/${enc(queryId)}`,
  executiveQueryRemarks: (queryId: string) => `/api/executive/queries/${enc(queryId)}/remarks`,
  executiveQueryRemarkImage: (queryId: string, remarkId: string) =>
    `/api/executive/queries/${enc(queryId)}/remarks/${enc(remarkId)}/file?disposition=inline`,
  executiveOrders: "/api/executive/orders",
  /** Multipart payment proof before confirm (returns `{ r2Key }`). */
  executiveUploads: "/api/executive/uploads",
  /** List assets for an order (GET). */
  executiveOrderAssets: (orderId: string) => `/api/executive/orders/${enc(orderId)}/assets`,
  /** GET binary file; `disposition=inline` to view, `attachment` to download. */
  executiveOrderAssetFile: (orderId: string, assetId: string, disposition: "inline" | "attachment") =>
    `/api/executive/orders/${enc(orderId)}/files/${enc(assetId)}?disposition=${disposition}`,
  /** DELETE source/customer asset row and object in R2/local storage. */
  executiveOrderAssetDelete: (orderId: string, assetId: string) =>
    `/api/executive/orders/${enc(orderId)}/files/${enc(assetId)}`,
  /** JSON `{ r2Key }` or multipart `file`. kind: `source` (print) or `customer` (customer photo). */
  executiveOrderAsset: (orderId: string, assetKind: "source" | "customer") =>
    `/api/executive/orders/${enc(orderId)}/assets/${assetKind}`,

  designerQueue: "/api/designer/queue",
  designerOrder: (orderId: string) => `/api/designer/orders/${enc(orderId)}`,
  designerOrderWhatsApp: (orderId: string) => `/api/designer/orders/${enc(orderId)}/whatsapp`,
  designerOrderAssets: (orderId: string) => `/api/designer/orders/${enc(orderId)}/assets`,
  designerOrderAssetFile: (orderId: string, assetId: string, disposition: "inline" | "attachment") =>
    `/api/designer/orders/${enc(orderId)}/files/${enc(assetId)}?disposition=${disposition}`,
  designerTakeOrder: (orderId: string) => `/api/designer/orders/${enc(orderId)}/take`,
  /** JSON `{ r2Key }` or multipart field `file`. */
  designerPreviewAssets: (orderId: string) => `/api/designer/orders/${enc(orderId)}/preview-assets`,
  designerPreviewRemarks: (orderId: string) => `/api/designer/orders/${enc(orderId)}/preview-remarks`,
  designerPreviewRemarkImage: (orderId: string, remarkId: string) =>
    `/api/designer/orders/${enc(orderId)}/preview-remarks/${enc(remarkId)}/file?disposition=inline`,
  /** Multipart remark attachment before save (returns `{ r2Key }`). */
  designerUploads: "/api/designer/uploads",
  designerOrderDecision: (orderId: string) => `/api/designer/orders/${enc(orderId)}/decision`,

  adminUsers: "/api/admin/users",
  adminUser: (userId: string) => `/api/admin/users/${enc(userId)}`,
  adminUserPassword: (userId: string) => `/api/admin/users/${enc(userId)}/password`,
  adminUserStatus: (userId: string) => `/api/admin/users/${enc(userId)}/status`,
  adminPricing: "/api/admin/pricing",
  adminPricingRow: (frameSize: string) => `/api/admin/pricing/${enc(frameSize)}`,
  adminWhatsAppDraft: "/api/admin/whatsapp-draft",
  adminWhatsAppDesignSharedDraft: "/api/admin/whatsapp-design-shared-draft",
  adminWhatsAppDispatchDraft: "/api/admin/whatsapp-dispatch-draft",
  adminWhatsAppPrintDraft: "/api/admin/whatsapp-print-draft",
  executiveQueryWhatsApp: (queryId: string) =>
    `/api/executive/queries/${enc(queryId)}/whatsapp`,
  adminOrder: (orderId: string) => `/api/admin/orders/${enc(orderId)}`,
  adminOrderPrintDone: (orderId: string) => `/api/admin/orders/${enc(orderId)}/print-done`,
  adminOrderBalancePayment: (orderId: string) => `/api/admin/orders/${enc(orderId)}/balance-payment`,
  adminOrderBalancePaid: (orderId: string) => `/api/admin/orders/${enc(orderId)}/balance-paid`,
  adminOrderSaveTracking: (orderId: string) => `/api/admin/orders/${enc(orderId)}/tracking`,
  adminOrderDispatch: (orderId: string) => `/api/admin/orders/${enc(orderId)}/dispatch`,
  adminOrderWhatsApp: (orderId: string, trackingNumber?: string) => {
    const base = `/api/admin/orders/${enc(orderId)}/whatsapp`;
    const t = trackingNumber?.trim();
    return t ? `${base}?trackingNumber=${encodeURIComponent(t)}` : base;
  },
  adminOrderPrintWhatsApp: (orderId: string) =>
    `/api/admin/orders/${enc(orderId)}/whatsapp-print`,
  adminOrderComplete: (orderId: string) => `/api/admin/orders/${enc(orderId)}/complete`,
  adminAttendanceReport: "/api/admin/attendance/report",
} as const;
