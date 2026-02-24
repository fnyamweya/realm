import { cn } from '@realtyos/frontend-utils';

export interface DeniedExplanationProps {
  reason: string;
  className?: string;
}

export function DeniedExplanation({ reason, className }: DeniedExplanationProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-12 text-center', className)}>
      <div className="rounded-full bg-muted p-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Access Denied</h3>
        <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
      </div>
    </div>
  );
}
