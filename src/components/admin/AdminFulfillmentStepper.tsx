import { WorkflowStepper } from "@/components/ui/WorkflowStepper";
import { fulfillmentStepStates, type FulfillmentStepId } from "@/lib/adminFulfillment";
import type { OrderListRow } from "@/lib/orderListTypes";

const STEPS: { id: FulfillmentStepId; label: string; num: number }[] = [
  { id: "print", label: "In print", num: 1 },
  { id: "frameReady", label: "Frame ready", num: 2 },
  { id: "balance", label: "Balance", num: 3 },
  { id: "dispatch", label: "Dispatch", num: 4 },
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
