/**
 * @module @convergence/ui/components/ui/table
 * @file Table component with semantic HTML structure for data display. Provides
 *   a flexible table component system with header, body, footer, rows, and
 *   cells.
 */

"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Renders a table element with responsive container wrapper.
 *
 * This component wraps a standard HTML table with a scrollable container for
 * responsive behavior. Supports all standard table HTML attributes.
 *
 * @example
 *   ```tsx
 *   <Table>
 *     <TableHeader>
 *       <TableRow>
 *         <TableHead>Name</TableHead>
 *         <TableHead>Status</TableHead>
 *       </TableRow>
 *     </TableHeader>
 *     <TableBody>
 *       <TableRow>
 *         <TableCell>John Doe</TableCell>
 *         <TableCell>Active</TableCell>
 *       </TableRow>
 *     </TableBody>
 *   </Table>
 *   ```;
 *
 * @param props - The properties for the Table component
 * @param props.className - Additional CSS classes to apply to the table
 * @param props... - All other standard table HTML attributes
 * @returns {JSX.Element} The rendered table component with container wrapper
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      {/* Table structure requires TableHeader with TableHead cells for accessibility.
          This is enforced by composition - users must provide proper table structure.
          NOSONAR: typescript:S5256 - Header structure is provided via children composition */}
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-sm bg-background rounded-md border",
          className
        )}
        {...props}
      />
    </div>
  );
}

/**
 * Renders the table header section.
 *
 * This component wraps table header rows with appropriate styling. Typically
 * contains TableHead cells.
 *
 * @example
 *   ```tsx
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Column 1</TableHead>
 *       <TableHead>Column 2</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   ```;
 *
 * @param props - The properties for the TableHeader component
 * @param props.className - Additional CSS classes to apply to the thead element
 * @param props... - All other standard thead HTML attributes
 * @returns {JSX.Element} The rendered table header component
 */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted/50 [&_tr]:border-b", className)}
      {...props}
    />
  );
}

/**
 * Renders the table body section.
 *
 * This component wraps table data rows with appropriate styling. Contains the
 * main content rows of the table.
 *
 * @example
 *   ```tsx
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>Data 1</TableCell>
 *       <TableCell>Data 2</TableCell>
 *     </TableRow>
 *   </TableBody>
 *   ```;
 *
 * @param props - The properties for the TableBody component
 * @param props.className - Additional CSS classes to apply to the tbody element
 * @param props... - All other standard tbody HTML attributes
 * @returns {JSX.Element} The rendered table body component
 */
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("bg-background [&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

/**
 * Renders the table footer section.
 *
 * This component wraps table footer rows with appropriate styling. Typically
 * used for totals, summaries, or additional table information.
 *
 * @example
 *   ```tsx
 *   <TableFooter>
 *     <TableRow>
 *       <TableCell>Total</TableCell>
 *       <TableCell>$100</TableCell>
 *     </TableRow>
 *   </TableFooter>
 *   ```;
 *
 * @param props - The properties for the TableFooter component
 * @param props.className - Additional CSS classes to apply to the tfoot element
 * @param props... - All other standard tfoot HTML attributes
 * @returns {JSX.Element} The rendered table footer component
 */
function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

/**
 * Renders a table row element.
 *
 * This component wraps table cells with hover and selection states. Supports
 * data-state attribute for selected state styling.
 *
 * @example
 *   ```tsx
 *   <TableRow>
 *     <TableCell>Cell 1</TableCell>
 *     <TableCell>Cell 2</TableCell>
 *   </TableRow>
 *   ```;
 *
 * @example
 *   ```tsx
 *   <TableRow data-state="selected">
 *     <TableCell>Selected Row</TableCell>
 *   </TableRow>
 *   ```;
 *
 * @param props - The properties for the TableRow component
 * @param props.className - Additional CSS classes to apply to the tr element
 * @param props... - All other standard tr HTML attributes
 * @returns {JSX.Element} The rendered table row component
 */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  );
}

/**
 * Renders a table header cell element.
 *
 * This component renders th elements with appropriate styling for column
 * headers. Supports checkboxes with special alignment handling.
 *
 * @example
 *   ```tsx
 *   <TableHead>Column Name</TableHead>
 *   ```;
 *
 * @example
 *   ```tsx
 *   <TableHead className="text-right">Amount</TableHead>
 *   ```;
 *
 * @param props - The properties for the TableHead component
 * @param props.className - Additional CSS classes to apply to the th element
 * @param props... - All other standard th HTML attributes
 * @returns {JSX.Element} The rendered table head cell component
 */
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

/**
 * Renders a table data cell element.
 *
 * This component renders td elements with appropriate styling. Supports
 * checkboxes with special alignment handling.
 *
 * @example
 *   ```tsx
 *   <TableCell>Cell Content</TableCell>
 *   ```;
 *
 * @example
 *   ```tsx
 *   <TableCell className="text-right font-mono">$99.99</TableCell>
 *   ```;
 *
 * @param props - The properties for the TableCell component
 * @param props.className - Additional CSS classes to apply to the td element
 * @param props... - All other standard td HTML attributes
 * @returns {JSX.Element} The rendered table cell component
 */
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

/**
 * Renders a table caption element.
 *
 * This component provides a caption or description for the table. Typically
 * displayed below the table.
 *
 * @example
 *   ```tsx
 *   <Table>
 *     <TableCaption>A list of recent transactions</TableCaption>
 *     <TableHeader>...</TableHeader>
 *   </Table>
 *   ```;
 *
 * @param props - The properties for the TableCaption component
 * @param props.className - Additional CSS classes to apply to the caption
 *   element
 * @param props... - All other standard caption HTML attributes
 * @returns {JSX.Element} The rendered table caption component
 */
function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
