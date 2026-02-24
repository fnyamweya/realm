'use client';
import type { Table } from '@tanstack/react-table';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        {table.getFilteredRowModel().rows.length} row(s) total
      </div>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium disabled:pointer-events-none disabled:opacity-50"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <span className="text-sm">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </span>
        <button
          type="button"
          className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium disabled:pointer-events-none disabled:opacity-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  );
}
