'use client';
import { useEffect, type ReactNode } from 'react';

export interface StepUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: ReactNode;
}

export function StepUpDialog({ open, onOpenChange, title, description, children }: StepUpDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} role="presentation" />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg" role="dialog" aria-modal="true" aria-label={title ?? 'Step-up verification'}>
        <h2 className="text-lg font-semibold">{title ?? 'Verification Required'}</h2>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
