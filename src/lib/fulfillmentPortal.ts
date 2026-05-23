import { apiPaths } from "@/lib/apiPaths";

export type FulfillmentPortalConfig = {
  roleLabel: string;
  kicker: string;
  productionPath: string;
  /** API path for loading the production queue (all org orders for admin/executive production). */
  productionOrdersApi: string;
  ordersListPath: string;
  patchPath?: string;
  fulfillPath: (orderId: string) => string;
  getOrder: (orderId: string) => string;
  printImageUpload: (orderId: string) => string;
  printImage: (orderId: string, disposition: "inline" | "attachment") => string;
  printDone: (orderId: string) => string;
  balancePayment: (orderId: string) => string;
  balancePaid: (orderId: string) => string;
  saveTracking: (orderId: string) => string;
  dispatch: (orderId: string) => string;
  complete: (orderId: string) => string;
  whatsappDispatch: (orderId: string, trackingNumber?: string) => string;
  whatsappPrint: (orderId: string) => string;
};

export const adminFulfillmentPortal: FulfillmentPortalConfig = {
  roleLabel: "Admin",
  kicker: "Admin",
  productionPath: "/admin/orders/production",
  productionOrdersApi: apiPaths.orders,
  ordersListPath: "/admin/orders",
  patchPath: "/admin/orders/patch",
  fulfillPath: (orderId) => `/admin/orders/${encodeURIComponent(orderId)}`,
  getOrder: apiPaths.adminOrder,
  printImageUpload: apiPaths.adminOrderPrintImageUpload,
  printImage: apiPaths.adminOrderPrintImage,
  printDone: apiPaths.adminOrderPrintDone,
  balancePayment: apiPaths.adminOrderBalancePayment,
  balancePaid: apiPaths.adminOrderBalancePaid,
  saveTracking: apiPaths.adminOrderSaveTracking,
  dispatch: apiPaths.adminOrderDispatch,
  complete: apiPaths.adminOrderComplete,
  whatsappDispatch: apiPaths.adminOrderWhatsApp,
  whatsappPrint: apiPaths.adminOrderPrintWhatsApp,
};

export const executiveFulfillmentPortal: FulfillmentPortalConfig = {
  roleLabel: "Executive",
  kicker: "Executive",
  productionPath: "/executive/orders/production",
  productionOrdersApi: apiPaths.executiveProductionOrders,
  ordersListPath: "/executive/orders",
  fulfillPath: (orderId) => `/executive/orders/${encodeURIComponent(orderId)}/fulfill`,
  getOrder: apiPaths.executiveFulfillmentOrder,
  printImageUpload: apiPaths.executiveOrderPrintImageUpload,
  printImage: apiPaths.executiveOrderPrintImage,
  printDone: apiPaths.executiveOrderPrintDone,
  balancePayment: apiPaths.executiveOrderBalancePayment,
  balancePaid: apiPaths.executiveOrderBalancePaid,
  saveTracking: apiPaths.executiveOrderSaveTracking,
  dispatch: apiPaths.executiveOrderDispatch,
  complete: apiPaths.executiveOrderComplete,
  whatsappDispatch: apiPaths.executiveOrderWhatsAppDispatch,
  whatsappPrint: apiPaths.executiveOrderPrintWhatsApp,
};
