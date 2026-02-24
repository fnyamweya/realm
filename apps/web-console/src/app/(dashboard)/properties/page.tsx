import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
} from '@realtyos/ui';
import { Plus } from 'lucide-react';
import { PropertiesTable } from './properties-table';

export const metadata = { title: 'Properties' };

const properties = [
  {
    id: '1',
    name: 'Maple Heights',
    address: '123 Maple Ave, Springfield',
    units: 24,
    occupancy: 92,
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Oak Residences',
    address: '456 Oak Blvd, Riverside',
    units: 36,
    occupancy: 88,
    status: 'active' as const,
  },
  {
    id: '3',
    name: 'Pine Street Complex',
    address: '789 Pine St, Lakewood',
    units: 12,
    occupancy: 100,
    status: 'active' as const,
  },
  {
    id: '4',
    name: 'Cedar Park Apartments',
    address: '321 Cedar Ln, Oakville',
    units: 48,
    occupancy: 75,
    status: 'maintenance' as const,
  },
  {
    id: '5',
    name: 'Birch View Condos',
    address: '654 Birch Dr, Maplewood',
    units: 18,
    occupancy: 94,
    status: 'active' as const,
  },
];

function PropertiesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PropertiesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Properties"
        description="Manage your property portfolio."
        actions={
          <Button asChild>
            <Link href="/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<PropertiesSkeleton />}>
        <PropertiesTable properties={properties} />
      </Suspense>
    </PageContainer>
  );
}
