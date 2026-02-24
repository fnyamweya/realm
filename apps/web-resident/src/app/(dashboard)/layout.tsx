'use client';

import {
  ResidentShell,
  type NavSection,
} from '@realtyos/ui-shells';
import {
  LayoutDashboard,
  Wrench,
  FileText,
  CreditCard,
} from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'Home',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Services',
    items: [
      {
        title: 'Maintenance',
        href: '/maintenance',
        icon: <Wrench className="h-4 w-4" />,
      },
      {
        title: 'Documents',
        href: '/documents',
        icon: <FileText className="h-4 w-4" />,
      },
      {
        title: 'Payments',
        href: '/payments',
        icon: <CreditCard className="h-4 w-4" />,
      },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ResidentShell navSections={navSections}>{children}</ResidentShell>;
}
