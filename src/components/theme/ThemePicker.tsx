import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { THEMES, type ThemeId } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, Palette } from "lucide-react";

type ThemePickerProps = {
  className?: string;
};

export function ThemePicker({ className }: ThemePickerProps) {
  const { themeId, setThemeId } = useTheme();
  const [open, setOpen] = useState(false);
  const active = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  function selectTheme(id: ThemeId) {
    setOpen(false);
    if (id !== themeId) {
      setThemeId(id);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-9 w-[10.25rem] shrink-0 justify-between gap-2 border-border bg-card px-2.5 shadow-sm",
            className,
          )}
          aria-label="Color theme"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Palette className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex gap-0.5 shrink-0" aria-hidden>
              {active.swatches.map((c) => (
                <span
                  key={c}
                  className="h-3 w-3 rounded-full border border-border/80"
                  style={{ backgroundColor: c }}
                />
              ))}
            </span>
            <span className="truncate text-xs font-medium">{active.label}</span>
          </span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 opacity-60 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        className="w-56"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel>Color theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => {
          const selected = themeId === t.id;
          return (
            <DropdownMenuItem
              key={t.id}
              className="gap-2.5 py-2 pl-2"
              onSelect={() => selectTheme(t.id)}
            >
              <Check
                className={cn("h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")}
                aria-hidden
              />
              <span className="flex gap-0.5 shrink-0" aria-hidden>
                {t.swatches.map((c) => (
                  <span
                    key={c}
                    className="h-3 w-3 rounded-full border border-border"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium leading-tight">{t.label}</span>
                <span className="block text-[0.65rem] text-muted-foreground leading-tight">
                  {t.description}
                </span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
