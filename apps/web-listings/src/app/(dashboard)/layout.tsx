'use client';

import {
  ConsoleShell,
  type NavSection,
} from '@realtyos/ui-shells';
import {
  LayoutDashboard,
  Building2,
  MessageSquareMore,
  LineChart,
} from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'Listings',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        title: 'Listings',
        href: '/listings',
        icon: <Building2 className="h-4 w-4" />,
      },
      {
        title: 'Inquiries',
        href: '/inquiries',
        icon: <MessageSquareMore className="h-4 w-4" />,
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: <LineChart className="h-4 w-4" />,
      },
    ],
  },
];

const user = {
  name: 'Listings Manager',
  email: 'listings@realtyos.com',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConsoleShell
      navSections={navSections}
      user={user}
      breadcrumbs={[
        { label: 'Listings', href: '/dashboard' },
        { label: 'Overview' },
      ]}
    >
      {children}
    </ConsoleShell>
  );
}
