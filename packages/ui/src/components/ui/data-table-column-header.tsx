/**
 * @module @convergence/ui/components/ui/data-table-column-header
 * @file Data table column header component with sorting support. Provides a
 *   sortable column header that integrates with TanStack Table sorting
 *   functionality.
 */

"use client";

import * as React from "react";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";

/** Props for the DataTableColumnHeader component. */
interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.ComponentProps<typeof TableHead> {
  /** The column definition from TanStack Table */
  column: Column<TData, TValue>;
  /** Optional title to display (defaults to column header) */
  title?: string;
}

/**
 * Sortable column header component for data tables.
 *
 * Displays a column header with sorting functionality. Shows sort indicators
 * (up/down arrows) based on the current sort state and allows toggling between
 * ascending, descending, and unsorted states.
 *
 * @example
 *   ```tsx
 *   <DataTableColumnHeader column={column} title="Name" />
 *   ```;
 *
 * @param props - DataTableColumnHeader component props
 * @param props.column - TanStack Table column definition
 * @param props.title - Optional title override
 * @param props.className - Additional CSS classes
 * @param props... - All other TableHead HTML attributes
 * @returns Sortable column header component
 */
function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <TableHead className={className} {...props}>
        {title ?? (column.id ? column.id : String(column.columnDef.header))}
      </TableHead>
    );
  }

  return (
    <TableHead className={cn("w-[100px]", className)} {...props}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>
          {title ?? (column.id ? column.id : String(column.columnDef.header))}
        </span>
        {column.getIsSorted() === "desc" ? (
          <ChevronDown className="ml-2 size-4" />
        ) : column.getIsSorted() === "asc" ? (
          <ChevronUp className="ml-2 size-4" />
        ) : (
          <ArrowUpDown className="ml-2 size-4" />
        )}
      </Button>
    </TableHead>
  );
}

export { DataTableColumnHeader, type DataTableColumnHeaderProps };
