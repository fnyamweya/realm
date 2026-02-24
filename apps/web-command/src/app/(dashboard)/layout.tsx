'use client';

import {
  CommandShell,
  type CommandEnvironment,
  type NavSection,
} from '@realtyos/ui-shells';
import {
  Activity,
  Building2,
  Search,
  Cpu,
  Settings,
} from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'Platform',
    items: [
      {
        title: 'Overview',
        href: '/overview',
        icon: <Activity className="h-4 w-4" />,
      },
      {
        title: 'Clients',
        href: '/clients',
        icon: <Building2 className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        title: 'Audit',
        href: '/audit',
        icon: <Search className="h-4 w-4" />,
      },
      {
        title: 'Jobs',
        href: '/jobs',
        icon: <Cpu className="h-4 w-4" />,
      },
      {
        title: 'Config',
        href: '/config',
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

const environment: CommandEnvironment =
  (process.env.NEXT_PUBLIC_ENVIRONMENT as CommandEnvironment) || 'development';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandShell navSections={navSections} environment={environment}>
      {children}
    </CommandShell>
  );
}
