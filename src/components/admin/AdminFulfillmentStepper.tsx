import { WorkflowStepper } from "@/components/ui/WorkflowStepper";
import { fulfillmentStepStates, type FulfillmentStepId } from "@/lib/adminFulfillment";
import type { OrderListRow } from "@/lib/orderListTypes";

const STEPS: { id: FulfillmentStepId; label: string; num: number }[] = [
  { id: "print", label: "Print", num: 1 },
  { id: "balance", label: "Balance", num: 2 },
  { id: "dispatch", label: "Dispatch", num: 3 },
];

export function AdminFulfillmentStepper({ order }: { order: OrderListRow }) {
  const states = fulfillmentStepStates(order);
  return (
    <WorkflowStepper
      steps={STEPS}
      states={states}
      ariaLabel="Fulfillment workflow progress"
    />
  );
}
