import { Suspense } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@realtyos/ui';
import { Building2, FileText, Wrench, DollarSign } from 'lucide-react';

export const metadata = { title: 'Dashboard' };

const stats = [
  {
    title: 'Total Properties',
    value: '24',
    change: '+2 this month',
    icon: Building2,
  },
  {
    title: 'Active Leases',
    value: '142',
    change: '+12 this month',
    icon: FileText,
  },
  {
    title: 'Open Maintenance',
    value: '8',
    change: '-3 from last week',
    icon: Wrench,
  },
  {
    title: 'Monthly Revenue',
    value: '$48,250',
    change: '+8.2% from last month',
    icon: DollarSign,
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

function RecentActivity() {
  const activities = [
    {
      id: '1',
      description: 'New lease signed - Unit 4B, Maple Heights',
      time: '2 hours ago',
    },
    {
      id: '2',
      description:
        'Maintenance request completed - Plumbing, Oak Residences #12',
      time: '5 hours ago',
    },
    {
      id: '3',
      description: 'Payment received - $1,250, John Smith',
      time: '1 day ago',
    },
    {
      id: '4',
      description: 'Property inspection scheduled - Pine Street Complex',
      time: '2 days ago',
    },
  ];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <p className="text-sm">{activity.description}</p>
              <span className="ml-4 whitespace-nowrap text-xs text-muted-foreground">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your property management portfolio."
      />
      <div className="space-y-4">
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <RecentActivity />
        </Suspense>
      </div>
    </PageContainer>
  );
}
