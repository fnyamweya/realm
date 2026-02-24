import { Suspense } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
} from '@realtyos/ui';
import { Building2, Users, Activity, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Overview' };

const stats = [
  {
    title: 'Active Clients',
    value: '47',
    change: '+3 this month',
    icon: Building2,
  },
  {
    title: 'Total Users',
    value: '2,841',
    change: '+124 this month',
    icon: Users,
  },
  {
    title: 'API Requests (24h)',
    value: '1.2M',
    change: '+8.4% from yesterday',
    icon: Activity,
  },
  {
    title: 'Error Rate',
    value: '0.03%',
    change: '-0.01% from yesterday',
    icon: AlertTriangle,
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
            <p className="text-xs text-muted-foreground">{stat.change}</p>
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

const systemStatuses = [
  { name: 'API Gateway', status: 'operational' },
  { name: 'Database Cluster', status: 'operational' },
  { name: 'Queue Workers', status: 'operational' },
  { name: 'Auth Service', status: 'operational' },
  { name: 'Storage (R2)', status: 'degraded' },
];

function SystemStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {systemStatuses.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
            >
              <span className="text-sm">{service.name}</span>
              <Badge
                variant={
                  service.status === 'operational' ? 'default' : 'secondary'
                }
              >
                {service.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const recentAlerts = [
  {
    id: '1',
    message: 'R2 storage latency elevated in EU region',
    severity: 'warning',
    time: '12 min ago',
  },
  {
    id: '2',
    message: 'Client onboarding rate spike detected',
    severity: 'info',
    time: '1 hour ago',
  },
  {
    id: '3',
    message: 'DLQ threshold reached for email-notifications queue',
    severity: 'error',
    time: '3 hours ago',
  },
  {
    id: '4',
    message: 'Scheduled maintenance window completed',
    severity: 'info',
    time: '6 hours ago',
  },
];

const severityVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  info: 'default',
  warning: 'secondary',
  error: 'destructive',
};

function RecentAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Badge variant={severityVariants[alert.severity]}>
                  {alert.severity}
                </Badge>
                <span className="text-sm">{alert.message}</span>
              </div>
              <span className="ml-4 whitespace-nowrap text-xs text-muted-foreground">
                {alert.time}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Platform Overview"
        description="System health and operational metrics."
      />
      <div className="space-y-4">
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>
        <div className="grid gap-4 md:grid-cols-2">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <SystemStatus />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <RecentAlerts />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
