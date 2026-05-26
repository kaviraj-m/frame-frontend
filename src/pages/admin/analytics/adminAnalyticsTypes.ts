export type AdminAnalyticsSummary = {
  queriesCreated: number;
  ordersCreated: number;
  ordersCompleted: number;
  ordersCancelled: number;
  ordersInProgress: number;
  conversionPercent: number;
  advanceCollected: number;
  fullPaymentTotal: number;
};

export type AdminAnalyticsDayRow = {
  date: string;
  queriesCreated: number;
  ordersCreated: number;
  ordersCompleted: number;
  advanceCollected: number;
  fullPaymentTotal: number;
};

export type AdminAnalyticsStatusRow = {
  status: string;
  count: number;
};

export type AdminAnalyticsExecutiveRow = {
  userId: string;
  username: string;
  ordersCreated: number;
  ordersCompleted: number;
  queriesCreated: number;
};

export type AdminAnalyticsFrameSizeRow = {
  frameSize: string;
  quantity: number;
};

export type AdminAnalyticsOverview = {
  from: string;
  to: string;
  summary: AdminAnalyticsSummary;
  daily: AdminAnalyticsDayRow[];
  statusBreakdown: AdminAnalyticsStatusRow[];
  executiveLeaderboard: AdminAnalyticsExecutiveRow[];
  topFrameSizes: AdminAnalyticsFrameSizeRow[];
};
