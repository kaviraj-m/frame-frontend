/** Shared order shape for list tables (matches backend Order JSON subset). */
export type OrderListRow = {
  orderId: string;
  queryId: string;
  customerUsername?: string;
  customerPhoneNumber?: string;
  customerEmail?: string;
  addressDetails?: string;
  designRemarks?: string;
  designStage?: string;
  status: string;
  frameSize?: string;
  lines?: { lineItemId: string; frameSize: string; quantity: number; sortOrder: number }[];
  paymentMode?: string;
  advancePayment?: number;
  balanceAmount?: number;
  fullPayment?: number;
  paymentStatus?: string;
  printStage?: string;
  printedFrameImage?: string;
  courierStage?: string;
  trackingNumber?: string;
  createdAt?: string;
  updatedAt?: string;
};
