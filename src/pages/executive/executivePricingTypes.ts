/** Row from GET /api/executive/pricing (active catalogue only). */
export type ExecutivePricingRow = {
  frameSize: string;
  onlinePrice: number;
  cashPrice: number;
  isActive?: boolean;
};
