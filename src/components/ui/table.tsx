import * as React from "react";
import { cn } from "@/lib/utils";

type TableProps = React.HTMLAttributes<HTMLTableElement> & {
  denseOnMobile?: boolean;
  stickyFirstColumn?: boolean;
};

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    {
      className,
      denseOnMobile = true,
      stickyFirstColumn = false,
      ...props
    }: TableProps,
    ref,
  ) => (
    <div className="relative w-full overflow-x-auto overscroll-x-contain touch-pan-y">
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm",
          denseOnMobile &&
            "[&_th]:px-2 [&_th]:text-[0.67rem] [&_td]:px-2 [&_td]:py-2 [&_td]:text-xs sm:[&_th]:px-3 sm:[&_th]:text-xs sm:[&_td]:px-3 sm:[&_td]:py-3 sm:[&_td]:text-sm",
          stickyFirstColumn &&
            "[&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:z-20 [&_th:first-child]:bg-gray-600 [&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10 [&_td:first-child]:bg-card",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        "data-[order-age]:bg-transparent data-[order-age]:transition-none data-[order-age]:hover:bg-transparent",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-11 px-3 text-left align-middle text-xs font-bold uppercase tracking-wide text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-3 align-middle text-sm", className)} {...props} />
));
TableCell.displayName = "TableCell";

/** Gray header row — same on all themes (not age row colors). */
const TableHeaderBand = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b border-gray-500 bg-gray-600",
      "[&_tr]:hover:bg-gray-600",
      "[&_th]:!bg-gray-600 [&_th]:!text-gray-100",
      className,
    )}
    {...props}
  />
));
TableHeaderBand.displayName = "TableHeaderBand";

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableHeaderBand };
