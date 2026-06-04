/**
 * Canonical REST paths for the Memorix backend. Use these from pages so URLs stay
 * aligned with `backend/internal/app/server.go`.
 */

const enc = (s: string) => encodeURIComponent(s);

export const apiPaths = {
  authLogin: "/api/auth/login",
  authRefresh: "/api/auth/refresh",
  authLogout: "/api/auth/logout",

  orders: "/api/orders",

  /** Active frame sizes and list prices (executive catalogue). */
  executivePricing: "/api/executive/pricing",
  executiveQueries: "/api/executive/queries",
  /** All organisation queries (read-only). */
  executiveQueriesAll: "/api/executive/all-queries",
  executiveQueryDetail: (queryId: string) => `/api/executive/queries/${enc(queryId)}`,
  executiveQueryRemarks: (queryId: string) => `/api/executive/queries/${enc(queryId)}/remarks`,
  executiveQueryRemarkImage: (queryId: string, remarkId: string) =>
    `/api/executive/queries/${enc(queryId)}/remarks/${enc(remarkId)}/file?disposition=inline`,
  executiveOrders: "/api/executive/orders",
  /** All organisation orders (read-only). */
  executiveOrdersAll: "/api/executive/all-orders",
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
  /** Customer photos for a specific frame line (multipart `file`). */
  executiveOrderLineAsset: (
    orderId: string,
    lineItemId: string,
    assetKind: "customer",
  ) =>
    `/api/executive/orders/${enc(orderId)}/line-items/${enc(lineItemId)}/assets/${assetKind}`,

  designerQueue: "/api/designer/queue",
  designerOrder: (orderId: string) => `/api/designer/orders/${enc(orderId)}`,
  designerOrderWhatsApp: (orderId: string) => `/api/designer/orders/${enc(orderId)}/whatsapp`,
  designerOrderAssets: (orderId: string) => `/api/designer/orders/${enc(orderId)}/assets`,
  designerOrderAssetFile: (orderId: string, assetId: string, disposition: "inline" | "attachment") =>
    `/api/designer/orders/${enc(orderId)}/files/${enc(assetId)}?disposition=${disposition}`,
  designerTakeOrder: (orderId: string) => `/api/designer/orders/${enc(orderId)}/take`,
  /** JSON `{ r2Key }` or multipart field `file`. */
  designerPreviewAssets: (orderId: string) => `/api/designer/orders/${enc(orderId)}/preview-assets`,
  designerLinePreviewAssets: (orderId: string, lineItemId: string) =>
    `/api/designer/orders/${enc(orderId)}/line-items/${enc(lineItemId)}/preview-assets`,
  designerPreviewRemarks: (orderId: string) => `/api/designer/orders/${enc(orderId)}/preview-remarks`,
  designerPreviewRemarkImage: (orderId: string, remarkId: string) =>
    `/api/designer/orders/${enc(orderId)}/preview-remarks/${enc(remarkId)}/file?disposition=inline`,
  /** Multipart remark attachment before save (returns `{ r2Key }`). */
  designerUploads: "/api/designer/uploads",
  designerOrderDecision: (orderId: string) => `/api/designer/orders/${enc(orderId)}/decision`,

  adminAnalyticsOverview: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    const base = "/api/admin/analytics/overview";
    return qs ? `${base}?${qs}` : base;
  },
  adminUsers: "/api/admin/users",
  adminUser: (userId: string) => `/api/admin/users/${enc(userId)}`,
  adminUserPerformance: (userId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    const base = `/api/admin/users/${enc(userId)}/performance`;
    return qs ? `${base}?${qs}` : base;
  },
  adminUserPerformanceDay: (userId: string, date: string) =>
    `/api/admin/users/${enc(userId)}/performance/day?date=${encodeURIComponent(date)}`,
  adminUserPassword: (userId: string) => `/api/admin/users/${enc(userId)}/password`,
  adminUserStatus: (userId: string) => `/api/admin/users/${enc(userId)}/status`,
  adminPricing: "/api/admin/pricing",
  adminPricingRow: (frameSize: string) => `/api/admin/pricing/${enc(frameSize)}`,
  adminWhatsAppDraft: "/api/admin/whatsapp-draft",
  adminWhatsAppDesignSharedDraft: "/api/admin/whatsapp-design-shared-draft",
  adminWhatsAppDispatchDraft: "/api/admin/whatsapp-dispatch-draft",
  adminWhatsAppPrintDraft: "/api/admin/whatsapp-print-draft",
  executiveOrderWhatsApp: (orderId: string) =>
    `/api/executive/orders/${enc(orderId)}/whatsapp`,
  executiveFeatures: "/api/executive/features",
  /** All orders for production & dispatch queue (executive, when feature enabled). */
  executiveProductionOrders: "/api/executive/production-orders",
  adminExecutiveFeatures: "/api/admin/settings/executive-features",
  adminShippingFrom: "/api/admin/settings/shipping-from",
  executiveShippingFrom: "/api/executive/settings/shipping-from",
  executiveFulfillmentOrder: (orderId: string) => `/api/executive/orders/${enc(orderId)}`,
  executiveOrderPrintImage: (orderId: string, disposition: "inline" | "attachment") =>
    `/api/executive/orders/${enc(orderId)}/print-image?disposition=${disposition}`,
  executiveOrderPrintImageUpload: (orderId: string) =>
    `/api/executive/orders/${enc(orderId)}/print-image`,
  executiveLinePrintImageUpload: (orderId: string, lineItemId: string) =>
    `/api/executive/orders/${enc(orderId)}/line-items/${enc(lineItemId)}/print-image`,
  executiveOrderPrintDone: (orderId: string) => `/api/executive/orders/${enc(orderId)}/print-done`,
  executiveOrderFrameReady: (orderId: string) => `/api/executive/orders/${enc(orderId)}/frame-ready`,
  executiveOrderBalancePayment: (orderId: string) =>
    `/api/executive/orders/${enc(orderId)}/balance-payment`,
  executiveOrderBalancePaid: (orderId: string) => `/api/executive/orders/${enc(orderId)}/balance-paid`,
  executiveOrderSaveTracking: (orderId: string) => `/api/executive/orders/${enc(orderId)}/tracking`,
  executiveOrderDispatch: (orderId: string) => `/api/executive/orders/${enc(orderId)}/dispatch`,
  executiveOrderComplete: (orderId: string) => `/api/executive/orders/${enc(orderId)}/complete`,
  executiveOrderWhatsAppDispatch: (orderId: string, trackingNumber?: string) => {
    const base = `/api/executive/orders/${enc(orderId)}/whatsapp-dispatch`;
    const t = trackingNumber?.trim();
    return t ? `${base}?trackingNumber=${encodeURIComponent(t)}` : base;
  },
  executiveOrderPrintWhatsApp: (orderId: string) =>
    `/api/executive/orders/${enc(orderId)}/whatsapp-print`,
  adminOrderExportContributors: "/api/admin/order-export-contributors",
  adminOrder: (orderId: string) => `/api/admin/orders/${enc(orderId)}`,
  adminDeleteOrder: (orderId: string) => `/api/admin/orders/${enc(orderId)}`,
  adminOrderDetail: (orderId: string) => `/api/admin/orders/${enc(orderId)}/detail`,
  adminQueryRemarkImage: (queryId: string, remarkId: string) =>
    `/api/admin/queries/${enc(queryId)}/remarks/${enc(remarkId)}/file?disposition=inline`,
  adminPreviewRemarkImage: (orderId: string, remarkId: string) =>
    `/api/admin/orders/${enc(orderId)}/preview-remarks/${enc(remarkId)}/file?disposition=inline`,
  adminOrderPrintImage: (orderId: string, disposition: "inline" | "attachment") =>
    `/api/admin/orders/${enc(orderId)}/print-image?disposition=${disposition}`,
  adminOrderPrintImageUpload: (orderId: string) => `/api/admin/orders/${enc(orderId)}/print-image`,
  adminLinePrintImageUpload: (orderId: string, lineItemId: string) =>
    `/api/admin/orders/${enc(orderId)}/line-items/${enc(lineItemId)}/print-image`,
  adminOrderPrintDone: (orderId: string) => `/api/admin/orders/${enc(orderId)}/print-done`,
  adminOrderFrameReady: (orderId: string) => `/api/admin/orders/${enc(orderId)}/frame-ready`,
  adminOrderAssets: (orderId: string) => `/api/admin/orders/${enc(orderId)}/assets`,
  adminOrderAssetFile: (orderId: string, assetId: string, disposition: "inline" | "attachment") =>
    `/api/admin/orders/${enc(orderId)}/files/${enc(assetId)}?disposition=${disposition}`,
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
  adminAttendanceToday: "/api/admin/attendance/today",
  adminAttendanceDaily: (date: string) =>
    `/api/admin/attendance/daily?date=${encodeURIComponent(date)}`,
  adminAttendanceUserDay: (userId: string, date: string) =>
    `/api/admin/attendance/users/${encodeURIComponent(userId)}/day?date=${encodeURIComponent(date)}`,
  adminAttendanceUserRange: (userId: string, from: string, to: string) => {
    const q = new URLSearchParams({ from, to });
    return `/api/admin/attendance/users/${encodeURIComponent(userId)}/range?${q}`;
  },
  adminAttendancePermissions: (date?: string, userId?: string) => {
    const q = new URLSearchParams();
    if (date) q.set("date", date);
    if (userId) q.set("userId", userId);
    const qs = q.toString();
    return qs ? `/api/admin/attendance/permissions?${qs}` : "/api/admin/attendance/permissions";
  },
  adminCreateAttendancePermission: "/api/admin/attendance/permissions",
  adminDeleteAttendancePermission: (permissionId: string) =>
    `/api/admin/attendance/permissions/${encodeURIComponent(permissionId)}`,
  adminAuditLogs: "/api/admin/audit-logs",
  adminQueries: "/api/admin/queries",
  adminDeleteQuery: (queryId: string) => `/api/admin/queries/${enc(queryId)}`,
} as const;
