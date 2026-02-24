import { cn } from '@realtyos/frontend-utils';
import { Skeleton } from '@realtyos/ui';

export interface SkeletonPageProps {
  className?: string;
}

export function SkeletonPage({ className }: SkeletonPageProps) {
  return (
    <div className={cn('space-y-6 p-6', className)} aria-busy="true" aria-label="Loading page">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Stat cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border">
        {/* Table header */}
        <div className="flex gap-4 border-b p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, row) => (
          <div key={row} className="flex gap-4 border-b p-4 last:border-0">
            {Array.from({ length: 5 }).map((_, col) => (
              <Skeleton key={col} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
