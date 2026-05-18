import { designerStepStates, type WorkflowStepId } from "../../lib/designerWorkflow";

const STEPS: { id: WorkflowStepId; label: string; num: number }[] = [
  { id: "take", label: "Take order", num: 1 },
  { id: "sources", label: "Source photos", num: 2 },
  { id: "preview", label: "Upload preview", num: 3 },
  { id: "signoff", label: "Customer sign-off", num: 4 },
];

export function DesignerWorkflowStepper({ status }: { status: string }) {
  const states = designerStepStates(status);

  return (
    <div className="designer-workflow-stepper" aria-label="Design workflow progress">
      {STEPS.map((step) => (
        <div
          key={step.id}
          className={`designer-workflow-step designer-workflow-step--${states[step.id]}`}
        >
          <span className="designer-workflow-step__num">{step.num}</span>
          {step.label}
        </div>
      ))}
    </div>
  );
}
