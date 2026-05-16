/** Row from GET /api/executive/pricing (active catalogue only). */
export type ExecutivePricingRow = {
  frameSize: string;
  price: number;
  isActive?: boolean;
};
