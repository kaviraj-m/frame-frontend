/** Row from GET /api/admin/pricing (all sizes, including inactive). */
export type AdminPricingRow = {
  frameSize: string;
  price: number;
  isActive: boolean;
};
