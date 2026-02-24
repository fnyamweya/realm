'use client';

import {
  ConsoleShell,
  type NavSection,
} from '@realtyos/ui-shells';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Wrench,
  DollarSign,
  Settings,
} from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        title: 'Properties',
        href: '/properties',
        icon: <Building2 className="h-4 w-4" />,
      },
      {
        title: 'Leases',
        href: '/leases',
        icon: <FileText className="h-4 w-4" />,
      },
      {
        title: 'Maintenance',
        href: '/maintenance',
        icon: <Wrench className="h-4 w-4" />,
      },
      {
        title: 'Finance',
        href: '/finance',
        icon: <DollarSign className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        title: 'Settings',
        href: '/settings',
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsoleShell navSections={navSections}>{children}</ConsoleShell>;
}
