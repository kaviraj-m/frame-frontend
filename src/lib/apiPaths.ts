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
    `/api/executive/files/${enc(orderId)}/${enc(assetId)}?disposition=${disposition}`,
  /** DELETE source/customer asset row and object in R2/local storage. */
  executiveOrderAssetDelete: (orderId: string, assetId: string) =>
    `/api/executive/files/${enc(orderId)}/${enc(assetId)}`,
  /** JSON `{ r2Key }` or multipart `file`. kind: `source` (print) or `customer` (customer photo). */
  executiveOrderAsset: (orderId: string, assetKind: "source" | "customer") =>
    `/api/executive/orders/${enc(orderId)}/assets/${assetKind}`,

  designerQueue: "/api/designer/queue",
  /** JSON `{ r2Key }` or multipart field `file` (separate from `/orders/.../decision` for kvolt routing). */
  designerPreviewAssets: (orderId: string) => `/api/designer/preview-assets/${enc(orderId)}`,
  designerOrderDecision: (orderId: string) => `/api/designer/orders/${enc(orderId)}/decision`,

  adminUsers: "/api/admin/users",
  adminUserStatus: (userId: string) => `/api/admin/users/${enc(userId)}/status`,
  adminPricing: "/api/admin/pricing",
  adminTemplates: "/api/admin/templates",
  adminOrder: (orderId: string) => `/api/admin/orders/${enc(orderId)}`,
  adminOrderManualNotify: (orderId: string) => `/api/admin/orders/${enc(orderId)}/manual-notify`,
  adminAttendanceReport: "/api/admin/attendance/report",
} as const;
