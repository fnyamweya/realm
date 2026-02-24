import type { ReactNode } from 'react';
import { cn } from '@realtyos/frontend-utils';

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn('flex flex-1 flex-col p-4 md:px-6', className)}>{children}</div>;
}
