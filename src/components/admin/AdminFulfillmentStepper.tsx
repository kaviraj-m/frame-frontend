import { fulfillmentStepStates, type FulfillmentStepId } from "../../lib/adminFulfillment";
import type { OrderListRow } from "../../lib/orderListTypes";

const STEPS: { id: FulfillmentStepId; label: string; num: number }[] = [
  { id: "print", label: "Print", num: 1 },
  { id: "balance", label: "Balance", num: 2 },
  { id: "dispatch", label: "Dispatch", num: 3 },
  { id: "complete", label: "Complete", num: 4 },
];

export function AdminFulfillmentStepper({ order }: { order: OrderListRow }) {
  const states = fulfillmentStepStates(order);

  return (
    <div className="workflow-stepper" aria-label="Fulfillment workflow progress">
      {STEPS.map((step) => (
        <div
          key={step.id}
          className={`workflow-step workflow-step--${states[step.id]}`}
        >
          <span className="workflow-step__num">{step.num}</span>
          {step.label}
        </div>
      ))}
    </div>
  );
}
