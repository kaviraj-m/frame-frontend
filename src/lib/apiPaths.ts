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
  designerOrderAssets: (orderId: string) => `/api/designer/orders/${enc(orderId)}/assets`,
  designerOrderAssetFile: (orderId: string, assetId: string, disposition: "inline" | "attachment") =>
    `/api/designer/orders/${enc(orderId)}/files/${enc(assetId)}?disposition=${disposition}`,
  designerTakeOrder: (orderId: string) => `/api/designer/orders/${enc(orderId)}/take`,
  /** JSON `{ r2Key }` or multipart field `file`. */
  designerPreviewAssets: (orderId: string) => `/api/designer/orders/${enc(orderId)}/preview-assets`,
  designerOrderDecision: (orderId: string) => `/api/designer/orders/${enc(orderId)}/decision`,

  adminUsers: "/api/admin/users",
  adminUserStatus: (userId: string) => `/api/admin/users/${enc(userId)}/status`,
  adminPricing: "/api/admin/pricing",
  adminTemplates: "/api/admin/templates",
  adminOrder: (orderId: string) => `/api/admin/orders/${enc(orderId)}`,
  adminOrderPrintDone: (orderId: string) => `/api/admin/orders/${enc(orderId)}/print-done`,
  adminOrderBalancePayment: (orderId: string) => `/api/admin/orders/${enc(orderId)}/balance-payment`,
  adminOrderBalancePaid: (orderId: string) => `/api/admin/orders/${enc(orderId)}/balance-paid`,
  adminOrderDispatch: (orderId: string) => `/api/admin/orders/${enc(orderId)}/dispatch`,
  adminOrderComplete: (orderId: string) => `/api/admin/orders/${enc(orderId)}/complete`,
  adminOrderManualNotify: (orderId: string) => `/api/admin/orders/${enc(orderId)}/manual-notify`,
  adminAttendanceReport: "/api/admin/attendance/report",
} as const;
