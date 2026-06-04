import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FILTER_FIELD_LABEL, RESPONSIVE_FILTER_SELECT } from "@/lib/responsive";
import { cn } from "@/lib/utils";

export type FilterMultiSelectOption = {
  value: string;
  label: string;
  count?: number;
};

type Props = {
  label: string;
  emptyLabel: string;
  selectedSummary?: string;
  options: FilterMultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  "aria-label": string;
};

function triggerLabel(
  selected: string[],
  options: FilterMultiSelectOption[],
  emptyLabel: string,
  selectedSummary?: string,
): string {
  if (selected.length === 0) return emptyLabel;
  if (selected.length === 1) {
    const opt = options.find((o) => o.value === selected[0]);
    return opt?.label ?? selected[0];
  }
  const noun = selectedSummary ?? "selected";
  return `${selected.length} ${noun}`;
}

export function FilterMultiSelect({
  label,
  emptyLabel,
  selectedSummary,
  options,
  selected,
  onChange,
  "aria-label": ariaLabel,
}: Props) {
  const selectedSet = new Set(selected);

  function toggle(value: string) {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange([...next]);
  }

  function selectAll() {
    onChange(options.map((o) => o.value));
  }

  function clearAll() {
    onChange([]);
  }

  const display = triggerLabel(selected, options, emptyLabel, selectedSummary);
  const isEmpty = selected.length === 0;

  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className={FILTER_FIELD_LABEL}>{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              RESPONSIVE_FILTER_SELECT,
              "justify-between gap-2 font-normal shadow-none hover:bg-muted/30",
              isEmpty && "text-muted-foreground",
            )}
            aria-label={ariaLabel}
          >
            <span className="truncate text-left">{display}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-[min(320px,70vh)] w-[min(100vw-2rem,280px)] overflow-y-auto"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem
            className="text-xs font-medium"
            onSelect={(e) => {
              e.preventDefault();
              selectAll();
            }}
          >
            Select all
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs font-medium"
            onSelect={(e) => {
              e.preventDefault();
              clearAll();
            }}
          >
            Clear
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {options.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={selectedSet.has(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="flex-1 truncate">{opt.label}</span>
              {opt.count !== undefined ? (
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {opt.count}
                </span>
              ) : null}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </label>
  );
}
