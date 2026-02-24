import { Suspense } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@realtyos/ui';
import { Play, Clock, AlertTriangle, Inbox } from 'lucide-react';

export const metadata = { title: 'Jobs' };

const queueStats = [
  { title: 'Active', value: '12', icon: Play, variant: 'default' as const },
  { title: 'Pending', value: '84', icon: Clock, variant: 'secondary' as const },
  { title: 'Failed', value: '3', icon: AlertTriangle, variant: 'destructive' as const },
  { title: 'DLQ', value: '1', icon: Inbox, variant: 'secondary' as const },
];

const jobs = [
  {
    id: 'job_88301',
    queue: 'email-notifications',
    status: 'active' as const,
    created: '2024-06-21 14:30:00',
    duration: '2.3s',
  },
  {
    id: 'job_88300',
    queue: 'billing-sync',
    status: 'active' as const,
    created: '2024-06-21 14:28:12',
    duration: '5.1s',
  },
  {
    id: 'job_88299',
    queue: 'document-generation',
    status: 'pending' as const,
    created: '2024-06-21 14:25:44',
    duration: '—',
  },
  {
    id: 'job_88295',
    queue: 'data-export',
    status: 'completed' as const,
    created: '2024-06-21 14:10:33',
    duration: '12.8s',
  },
  {
    id: 'job_88291',
    queue: 'email-notifications',
    status: 'failed' as const,
    created: '2024-06-21 13:55:01',
    duration: '0.4s',
  },
  {
    id: 'job_88280',
    queue: 'billing-sync',
    status: 'dlq' as const,
    created: '2024-06-21 12:40:18',
    duration: '—',
  },
];

type JobStatus = 'active' | 'pending' | 'completed' | 'failed' | 'dlq';

const jobStatusVariants: Record<JobStatus, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  pending: 'secondary',
  completed: 'default',
  failed: 'destructive',
  dlq: 'destructive',
};

function QueueHealthCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {queueStats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QueueHealthSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function JobsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Queue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-sm">{job.id}</TableCell>
                <TableCell>{job.queue}</TableCell>
                <TableCell>
                  <Badge variant={jobStatusVariants[job.status]}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {job.created}
                </TableCell>
                <TableCell>{job.duration}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function JobsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Jobs & Queues"
        description="Monitor job queues and processing status."
      />
      <div className="space-y-4">
        <Suspense fallback={<QueueHealthSkeleton />}>
          <QueueHealthCards />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <JobsTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
