import { Suspense } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  Skeleton,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@realtyos/ui';
import Link from 'next/link';

export const metadata = { title: 'Maintenance' };

const requests = [
  {
    id: 'MR-101',
    description: 'Leaking faucet in kitchen',
    status: 'open' as const,
    priority: 'medium' as const,
    date: '2024-12-01',
  },
  {
    id: 'MR-102',
    description: 'HVAC not heating properly',
    status: 'in-progress' as const,
    priority: 'high' as const,
    date: '2024-11-28',
  },
  {
    id: 'MR-103',
    description: 'Bathroom light fixture flickering',
    status: 'completed' as const,
    priority: 'low' as const,
    date: '2024-11-15',
  },
  {
    id: 'MR-104',
    description: 'Front door lock is stiff',
    status: 'open' as const,
    priority: 'medium' as const,
    date: '2024-12-03',
  },
];

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'destructive',
  'in-progress': 'default',
  completed: 'secondary',
};

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'outline',
  medium: 'secondary',
  high: 'destructive',
};

function MaintenanceRequests() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.id}</TableCell>
                <TableCell>{request.description}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[request.status]}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={priorityVariant[request.priority]}>
                    {request.priority}
                  </Badge>
                </TableCell>
                <TableCell>{request.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function MaintenanceSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MaintenancePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Maintenance Requests"
        description="View and manage your maintenance requests."
        actions={
          <Link href="/maintenance/new">
            <Button>New Request</Button>
          </Link>
        }
      />
      <Suspense fallback={<MaintenanceSkeleton />}>
        <MaintenanceRequests />
      </Suspense>
    </PageContainer>
  );
}
