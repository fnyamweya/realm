import { Suspense } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import { Card, CardContent, Badge, Skeleton } from '@realtyos/ui';
import { LeasesTable } from './leases-table';

export const metadata = { title: 'Leases' };

const leases = [
  {
    id: '1',
    tenant: 'John Smith',
    property: 'Maple Heights',
    unit: '4B',
    start: '2024-01-01',
    end: '2025-01-01',
    status: 'active' as const,
  },
  {
    id: '2',
    tenant: 'Jane Doe',
    property: 'Oak Residences',
    unit: '12A',
    start: '2024-03-15',
    end: '2025-03-15',
    status: 'active' as const,
  },
  {
    id: '3',
    tenant: 'Robert Johnson',
    property: 'Pine Street Complex',
    unit: '7C',
    start: '2023-06-01',
    end: '2024-06-01',
    status: 'expired' as const,
  },
  {
    id: '4',
    tenant: 'Sarah Williams',
    property: 'Cedar Park Apartments',
    unit: '22D',
    start: '2024-07-01',
    end: '2025-07-01',
    status: 'active' as const,
  },
  {
    id: '5',
    tenant: 'Michael Brown',
    property: 'Birch View Condos',
    unit: '3A',
    start: '2024-02-01',
    end: '2024-08-01',
    status: 'pending' as const,
  },
];

function LeasesSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeasesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Leases"
        description="Manage tenant leases across your properties."
      />
      <Suspense fallback={<LeasesSkeleton />}>
        <LeasesTable leases={leases} />
      </Suspense>
    </PageContainer>
  );
}
