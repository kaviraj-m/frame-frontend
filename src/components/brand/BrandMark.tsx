import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/brand";

type BrandMarkProps = {
  variant: "sidebar" | "login";
  className?: string;
};

export function BrandMark({ variant, className }: BrandMarkProps) {
  const isLogin = variant === "login";

  return (
    <div
      className={cn(
        "min-w-0",
        isLogin ? "inline-flex justify-center" : "flex",
        className,
      )}
    >
      <span
        className={cn(
          "font-[family-name:var(--font-display)] font-semibold leading-none tracking-[-0.02em] text-primary",
          isLogin ? "text-[1.875rem]" : "text-[1.25rem]",
        )}
        aria-label={BRAND_NAME}
      >
        {BRAND_NAME}
      </span>
    </div>
  );
}
