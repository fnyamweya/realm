'use client';
import { useSession } from '@realtyos/auth-web';
import { cn } from '@realtyos/frontend-utils';

export interface PermissionBannerProps {
  requiredPermission: string;
  message?: string;
  className?: string;
}

export function PermissionBanner({ requiredPermission, message, className }: PermissionBannerProps) {
  const { session } = useSession();
  const permissions = session?.permissions ?? [];
  const hasPermission = permissions.includes(requiredPermission);

  if (hasPermission) return null;

  return (
    <div
      role="alert"
      className={cn(
        'rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
        className,
      )}
    >
      {message ?? `You don't have permission to perform this action. Required: ${requiredPermission}`}
    </div>
  );
}
