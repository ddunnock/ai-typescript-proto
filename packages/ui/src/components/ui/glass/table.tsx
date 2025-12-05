/**
 * @module @convergence/ui/components/ui/glass/table
 * @file Glass Table - Enhanced table component with glassmorphism effects.
 *   Provides a data table with glass styling and optional glow effects for
 *   displaying structured information with visual elegance.
 */

"use client";

import * as React from "react";
import {
  Table as BaseTable,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Props for the Glass Table component.
 *
 * Extends the base Table props with glass-specific options for glow effects.
 *
 * @extends {React.ComponentProps<typeof BaseTable>}
 * @interface TableProps
 */
export interface TableProps extends React.ComponentProps<typeof BaseTable> {
  /**
   * Whether to apply a purple glow effect around the table. Useful for
   * highlighting important data tables or creating visual emphasis.
   *
   * @default false
   */
  glow?: boolean;
}

/**
 * Glass-styled table with customizable glow effects.
 *
 * An enhanced version of the base Table that applies glassmorphism styling and
 * supports an optional purple glow effect. Use this component for displaying
 * tabular data, lists, or any structured information that should stand out with
 * a glassmorphism aesthetic.
 *
 * @example
 *   ```tsx
 *   // Basic glass table
 *   <Table>
 *     <TableHeader>
 *       <TableRow>
 *         <TableHead>Name</TableHead>
 *         <TableHead>Status</TableHead>
 *       </TableRow>
 *     </TableHeader>
 *     <TableBody>
 *       <TableRow>
 *         <TableCell>Item 1</TableCell>
 *         <TableCell>Active</TableCell>
 *       </TableRow>
 *     </TableBody>
 *   </Table>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Glass table with glow effect
 *   <Table glow>
 *     <TableCaption>A list of items</TableCaption>
 *     <TableHeader>
 *       <TableRow>
 *         <TableHead>Column A</TableHead>
 *         <TableHead>Column B</TableHead>
 *       </TableRow>
 *     </TableHeader>
 *     <TableBody>
 *       <TableRow>
 *         <TableCell>Data A</TableCell>
 *         <TableCell>Data B</TableCell>
 *       </TableRow>
 *     </TableBody>
 *     <TableFooter>
 *       <TableRow>
 *         <TableCell colSpan={2}>Footer content</TableCell>
 *       </TableRow>
 *     </TableFooter>
 *   </Table>
 *   ```;
 *
 * @param props - Table component props
 * @param props.className - Additional CSS classes to merge with table styles
 * @param props.glow - Whether to apply a purple glow effect (default: false)
 * @param props.children - Table content (TableHeader, TableBody, etc.)
 * @param props... - All other standard Table HTML attributes
 * @returns Glass-styled table element
 * @see {@link TableHeader} For table header section
 * @see {@link TableBody} For table body section
 * @see {@link TableFooter} For table footer section
 * @see {@link TableRow} For table rows
 * @see {@link TableHead} For table header cells
 * @see {@link TableCell} For table data cells
 * @see {@link TableCaption} For table caption
 */
export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, glow = false, ...props }, ref) => {
    return (
      <BaseTable
        ref={ref}
        className={cn(
          "border-glass-border rounded-lg border bg-glass-bg/30 backdrop-blur-md",
          glow &&
            "[box-shadow:0_0_20px_hsl(var(--primary)/0.5),0_0_40px_hsl(var(--primary)/0.3)] ring-2 ring-primary/30",
          className
        )}
        {...props}
      />
    );
  }
);
Table.displayName = "Table";

/**
 * Header section for the Table component. Contains column headers for the table
 * data.
 *
 * @see {@link https://ui.shadcn.com/docs/components/table Shadcn UI Table}
 */
export { TableHeader };

/**
 * Body section for the Table component. Contains the main data rows of the
 * table.
 *
 * @see {@link https://ui.shadcn.com/docs/components/table Shadcn UI Table}
 */
export { TableBody };

/**
 * Footer section for the Table component. Contains summary or footer
 * information for the table.
 *
 * @see {@link https://ui.shadcn.com/docs/components/table Shadcn UI Table}
 */
export { TableFooter };

/**
 * Header cell for the Table component. Used within TableHeader to define column
 * headers.
 *
 * @see {@link https://ui.shadcn.com/docs/components/table Shadcn UI Table}
 */
export { TableHead };

/**
 * Row element for the Table component. Contains TableHead cells in the header
 * or TableCell cells in the body.
 *
 * @see {@link https://ui.shadcn.com/docs/components/table Shadcn UI Table}
 */
export { TableRow };

/**
 * Data cell for the Table component. Used within TableRow to display table
 * data.
 *
 * @see {@link https://ui.shadcn.com/docs/components/table Shadcn UI Table}
 */
export { TableCell };

/**
 * Caption element for the Table component. Provides a description or title for
 * the table.
 *
 * @see {@link https://ui.shadcn.com/docs/components/table Shadcn UI Table}
 */
export { TableCaption };
