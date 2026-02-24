'use client';
import type { Column } from '@tanstack/react-table';
import { cn } from '@realtyos/frontend-utils';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <button
      type="button"
      className={cn(
        'flex items-center space-x-2 -ml-3 h-8 px-3 hover:bg-accent hover:text-accent-foreground rounded-md',
        className,
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      <span>{title}</span>
      {column.getIsSorted() === 'asc' ? (
        <span aria-hidden="true">↑</span>
      ) : column.getIsSorted() === 'desc' ? (
        <span aria-hidden="true">↓</span>
      ) : (
        <span aria-hidden="true" className="opacity-0 group-hover:opacity-100">
          ↕
        </span>
      )}
    </button>
  );
}
