'use client';

import {
  ConsoleShell,
  type NavSection,
} from '@realtyos/ui-shells';
import {
  LayoutDashboard,
  Folder,
  Boxes,
  KanbanSquare,
  Sparkles,
  CircleUser,
  User,
  LogIn,
  Plus,
} from 'lucide-react';
import { HeaderActions } from './_components/header-actions';

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        title: 'Workspaces',
        href: '/workspaces',
        icon: <Folder className="h-4 w-4" />,
      },
      {
        title: 'Product',
        href: '/product',
        icon: <Boxes className="h-4 w-4" />,
      },
      {
        title: 'Kanban',
        href: '/kanban',
        icon: <KanbanSquare className="h-4 w-4" />,
      },
      {
        title: 'Pro',
        href: '/pro',
        icon: <Sparkles className="h-4 w-4" />,
        children: [
          {
            title: 'Exclusive',
            href: '/pro/exclusive',
            icon: <Sparkles className="h-4 w-4" />,
          },
        ],
      },
      {
        title: 'Account',
        href: '/account',
        icon: <CircleUser className="h-4 w-4" />,
        children: [
          {
            title: 'Profile',
            href: '/dashboard/profile',
            icon: <User className="h-4 w-4" />,
          },
          {
            title: 'Login',
            href: '/login',
            icon: <LogIn className="h-4 w-4" />,
          },
        ],
      },
    ],
  },
];

const orgs = [
  {
    name: 'Create organization',
    plan: 'Get started',
    logo: <Plus className="size-4" />,
  },
];

const user = {
  name: 'Felix Nyamweya',
  email: 'omburaafelix@gmail.com',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConsoleShell
      navSections={navSections}
      orgs={orgs}
      user={user}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Overview' },
      ]}
      headerActions={<HeaderActions userName={user.name} />}
    >
      {children}
    </ConsoleShell>
  );
}
