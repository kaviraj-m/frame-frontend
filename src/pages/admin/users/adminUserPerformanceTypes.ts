export type AdminUserDetail = {
  id: string;
  username: string;
  email?: string;
  role: string;
  executiveId?: string;
  isActive: boolean;
  createdAt?: string;
};

export type UserPerformanceSummary = {
  ordersCreatedTotal: number;
  ordersCompletedTotal: number;
  queriesCreatedTotal: number;
  ordersInProgress: number;
};

export type UserPerformanceDayRow = {
  date: string;
  ordersCreated: number;
  ordersCompleted: number;
  queriesCreated: number;
};

export type UserPerformanceResponse = {
  user: AdminUserDetail;
  from: string;
  to: string;
  summary: UserPerformanceSummary;
  daily: UserPerformanceDayRow[];
};

export type OrderListSummary = {
  orderId: string;
  queryId: string;
  customerUsername?: string;
  customerPhoneNumber?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type QueryListSummary = {
  queryId: string;
  customerUsername: string;
  customerPhoneNumber: string;
  createdAt: string;
};

export type UserPerformanceDayDetail = {
  date: string;
  createdOrders: OrderListSummary[];
  completedOrders: OrderListSummary[];
  createdQueries: QueryListSummary[];
};
