/** Shared order shape for list tables (matches backend Order JSON subset). */
export type OrderListRow = {
  orderId: string;
  queryId: string;
  customerUsername?: string;
  customerPhoneNumber?: string;
  customerEmail?: string;
  addressDetails?: string;
  designRemarks?: string;
  status: string;
  frameSize?: string;
  paymentMode?: string;
  advancePayment?: number;
  balanceAmount?: number;
  fullPayment?: number;
  paymentStatus?: string;
  trackingNumber?: string;
  createdAt?: string;
  updatedAt?: string;
};
