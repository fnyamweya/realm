import { DashboardWorkspaceShell } from '@/components/portal/chrome';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardWorkspaceShell>{children}</DashboardWorkspaceShell>;
}
