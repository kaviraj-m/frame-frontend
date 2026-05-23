import { WorkflowStepper } from "@/components/ui/WorkflowStepper";
import { designerStepStates, type WorkflowStepId } from "@/lib/designerWorkflow";

const STEPS: { id: WorkflowStepId; label: string; num: number }[] = [
  { id: "take", label: "Take order", num: 1 },
  { id: "sources", label: "Source photos", num: 2 },
  { id: "preview", label: "Upload preview", num: 3 },
  { id: "signoff", label: "Customer sign-off", num: 4 },
];

export function DesignerWorkflowStepper({ status }: { status: string }) {
  const states = designerStepStates(status);
  return (
    <WorkflowStepper steps={STEPS} states={states} ariaLabel="Design workflow progress" />
  );
}
