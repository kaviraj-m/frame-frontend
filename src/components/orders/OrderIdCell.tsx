import { orderIdCellClassName } from "../../lib/orderCreatedAge";

type Props = {
  orderId: string;
};

export function OrderIdCell({ orderId }: Props) {
  return <span className={orderIdCellClassName()}>{orderId}</span>;
}
