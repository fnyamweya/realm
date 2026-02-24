import { Suspense } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import { Card, CardContent, Skeleton } from '@realtyos/ui';
import { MaintenanceTable } from './maintenance-table';

export const metadata = { title: 'Maintenance' };

const requests = [
  {
    id: 'MR-001',
    property: 'Maple Heights',
    description: 'Leaking faucet in kitchen',
    priority: 'medium' as const,
    status: 'open' as const,
    created: '2024-12-01',
  },
  {
    id: 'MR-002',
    property: 'Oak Residences',
    description: 'Broken window lock - Unit 12A',
    priority: 'high' as const,
    status: 'in-progress' as const,
    created: '2024-11-28',
  },
  {
    id: 'MR-003',
    property: 'Pine Street Complex',
    description: 'HVAC system not heating properly',
    priority: 'high' as const,
    status: 'open' as const,
    created: '2024-12-02',
  },
  {
    id: 'MR-004',
    property: 'Cedar Park Apartments',
    description: 'Parking lot light burnt out',
    priority: 'low' as const,
    status: 'completed' as const,
    created: '2024-11-20',
  },
  {
    id: 'MR-005',
    property: 'Birch View Condos',
    description: 'Elevator maintenance required',
    priority: 'high' as const,
    status: 'open' as const,
    created: '2024-12-03',
  },
];

function MaintenanceSkeleton() {
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

export default function MaintenancePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Maintenance"
        description="Track and manage maintenance requests."
      />
      <Suspense fallback={<MaintenanceSkeleton />}>
        <MaintenanceTable requests={requests} />
      </Suspense>
    </PageContainer>
  );
}
