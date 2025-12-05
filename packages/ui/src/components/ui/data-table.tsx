/**
 * @module @convergence/ui/components/ui/data-table
 * @file Data table component that wraps TanStack Table with our Table
 *   components. Provides a flexible data table with sorting, filtering,
 *   pagination, and column visibility features.
 */

"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type TableOptions,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Props for the DataTable component. */
interface DataTableProps<TData, TValue> {
  /** Array of column definitions from TanStack Table */
  columns: ColumnDef<TData, TValue>[];
  /** Array of data objects to display */
  data: TData[];
  /** Additional TanStack Table options */
  tableOptions?: Omit<
    TableOptions<TData>,
    "data" | "columns" | "getCoreRowModel"
  >;
}

/**
 * Data table component that integrates TanStack Table with our Table
 * components.
 *
 * Provides a complete data table solution with built-in support for sorting,
 * filtering, and pagination. Uses TanStack Table for state management and our
 * Table components for rendering.
 *
 * @example
 *   ```tsx
 *   const columns: ColumnDef<Data>[] = [
 *     {
 *       accessorKey: "name",
 *       header: "Name",
 *     },
 *   ];
 *
 *   <DataTable columns={columns} data={data} />
 *   ```;
 *
 * @param props - DataTable component props
 * @param props.columns - Column definitions for the table
 * @param props.data - Data array to display
 * @param props.tableOptions - Additional TanStack Table configuration
 * @returns Data table component
 */
function DataTable<TData, TValue>({
  columns,
  data,
  tableOptions,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...tableOptions,
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export { DataTable, type DataTableProps };
