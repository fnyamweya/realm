import { Suspense } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Button,
} from '@realtyos/ui';
import {
  DollarSign,
  CalendarDays,
  Wrench,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Dashboard' };

const stats = [
  {
    title: 'Current Balance',
    value: '$0.00',
    detail: 'No balance due',
    icon: DollarSign,
  },
  {
    title: 'Next Payment Due',
    value: 'Jan 1, 2025',
    detail: 'Rent - $1,250.00',
    icon: CalendarDays,
  },
  {
    title: 'Open Requests',
    value: '1',
    detail: 'Maintenance in progress',
    icon: Wrench,
  },
  {
    title: 'Documents',
    value: '3',
    detail: 'Available for review',
    icon: FileText,
  },
];

function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="mt-1 h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Link href="/maintenance/new">
            <Button variant="outline">Submit Maintenance Request</Button>
          </Link>
          <Link href="/payments">
            <Button variant="outline">View Payment History</Button>
          </Link>
          <Link href="/documents">
            <Button variant="outline">View Documents</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Welcome Home"
        description="Manage your home, maintenance requests, and payments."
      />
      <div className="space-y-4">
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <QuickActions />
        </Suspense>
      </div>
    </PageContainer>
  );
}
